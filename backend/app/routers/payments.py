import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import update
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from sqlalchemy import select
from starlette.concurrency import run_in_threadpool

from app.models import Product

from app.config import settings
from app.database import get_db
from app.models import Order, User
from app.routers.orders import load_order
from app.schemas import PaymentIntentResponse
from app.security import get_current_user


router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"],
)


@router.post(
    "/orders/{order_id}/intent",
    response_model=PaymentIntentResponse,
)
def create_payment_intent(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = load_order(db, order_id, current_user.id)

    # Serialize payment setup against order cancellation in SQLite.
    result = db.execute(
        update(Order)
        .where(
            Order.id == order_id,
            Order.user_id == current_user.id,
            Order.status.in_(["pending", "payment_failed"]),
        )
        .values(status=Order.status)
        .execution_options(synchronize_session=False)
    )

    if result.rowcount != 1:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This order is already paid or cancelled.",
        )

    db.refresh(order)

    try:
        if order.stripe_payment_intent_id:
            intent = stripe.PaymentIntent.retrieve(
                order.stripe_payment_intent_id,
                api_key=settings.STRIPE_SECRET_KEY,
            )
        else:
            intent = stripe.PaymentIntent.create(
                amount=order.total_paise,
                currency=order.currency,
                automatic_payment_methods={
                    "enabled": True,
                    "allow_redirects": "never",
                },
                metadata={
                    "order_id": str(order.id),
                    "user_id": str(current_user.id),
                    "app": "stylehub",
                },
                description=f"StyleHub order #{order.id}",
                idempotency_key=f"stylehub-{order.checkout_key}",
                api_key=settings.STRIPE_SECRET_KEY,
            )

            order.stripe_payment_intent_id = intent.id

        if intent.status == "canceled":
            raise HTTPException(
                status_code=409,
                detail="This payment has been cancelled.",
            )

        if intent.status == "succeeded":
            raise HTTPException(
                status_code=409,
                detail="Payment already succeeded. Refresh the order.",
            )

        db.commit()

    except stripe.StripeError:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to contact Stripe or create payment. "
                "Check the server configuration and retry."
            ),
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

    return PaymentIntentResponse(
        order_id=order.id,
        payment_intent_id=intent.id,
        client_secret=intent.client_secret,
        publishable_key=settings.STRIPE_PUBLISHABLE_KEY,
        payment_status=intent.status,
    )

def process_payment_event(event, db: Session):
    supported_events = {
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "payment_intent.canceled",
    }

    if event["type"] not in supported_events:
        return {"received": True}

    event_intent = event["data"]["object"]

    order = db.scalar(
        select(Order).where(
            Order.stripe_payment_intent_id == event_intent["id"]
        )
    )

    # Ignore payments belonging to other projects in this sandbox.
    if order is None:
        return {"received": True}

    try:
        intent = stripe.PaymentIntent.retrieve(
            order.stripe_payment_intent_id,
            api_key=settings.STRIPE_SECRET_KEY,
        )
    except stripe.StripeError:
        raise HTTPException(
            status_code=502,
            detail="Unable to verify payment with Stripe.",
        )

    metadata = intent.metadata.to_dict()

    if (
        intent.livemode
        or intent.amount != order.total_paise
        or intent.currency != order.currency
        or metadata.get("app") != "stylehub"
        or metadata.get("order_id") != str(order.id)
        or metadata.get("user_id") != str(order.user_id)
    ):
        raise HTTPException(
            status_code=400,
            detail="Payment does not match the order.",
        )

    if intent.status == "succeeded":
        db.execute(
            update(Order)
            .where(
                Order.id == order.id,
                Order.status.in_(["pending", "payment_failed"]),
            )
            .values(
                status="paid",
                paid_at=datetime.now(timezone.utc),
            )
            .execution_options(synchronize_session=False)
        )

    elif intent.status == "canceled":
        result = db.execute(
            update(Order)
            .where(
                Order.id == order.id,
                Order.status.in_(["pending", "payment_failed"]),
            )
            .values(status="cancelled")
            .execution_options(synchronize_session=False)
        )

        # Restore reserved stock only on the first cancellation.
        if result.rowcount == 1:
            for item in order.items:
                db.execute(
                    update(Product)
                    .where(Product.id == item.product_id)
                    .values(stock=Product.stock + item.quantity)
                    .execution_options(synchronize_session=False)
                )

    elif (
        intent.status == "requires_payment_method"
        and getattr(intent, "last_payment_error", None)
    ):
        db.execute(
            update(Order)
            .where(
                Order.id == order.id,
                Order.status.in_(["pending", "payment_failed"]),
            )
            .values(status="payment_failed")
            .execution_options(synchronize_session=False)
        )

    else:
        db.execute(
            update(Order)
            .where(
                Order.id == order.id,
                Order.status == "payment_failed",
            )
            .values(status="pending")
            .execution_options(synchronize_session=False)
        )

    db.commit()
    return {"received": True}


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Webhook signing secret is not configured.",
        )

    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    if not signature:
        raise HTTPException(
            status_code=400,
            detail="Missing Stripe signature.",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook payload or signature.",
        )

    return await run_in_threadpool(
        process_payment_event,
        event,
        db,
    )
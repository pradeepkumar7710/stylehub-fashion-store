from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import CartItem, Order, OrderItem, Product, User
from app.schemas import OrderResponse
from app.security import get_current_user


router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"],
)


def load_order(db: Session, order_id: int, user_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.id == order_id,
            Order.user_id == user_id,
        )
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    return order


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(
    idempotency_key: UUID = Header(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    checkout_key = str(idempotency_key)

    existing = db.scalar(
        select(Order).where(Order.checkout_key == checkout_key)
    )

    if existing is not None:
        return load_order(db, existing.id, current_user.id)

    rows = db.execute(
        select(CartItem, Product)
        .join(Product, CartItem.product_id == Product.id)
        .where(CartItem.user_id == current_user.id)
        .order_by(CartItem.id)
    ).all()

    if not rows:
        raise HTTPException(
            status_code=400,
            detail="Your cart is empty.",
        )

    order = Order(
        user_id=current_user.id,
        checkout_key=checkout_key,
        total_paise=0,
        status="pending",
    )

    try:
        for item, product in rows:
            if item.size not in product.sizes:
                raise HTTPException(
                    status_code=400,
                    detail=f"Selected size unavailable: {product.name}.",
                )

            if product.price_paise <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid product price: {product.name}.",
                )

            # Check and reduce stock together to avoid overselling.
            result = db.execute(
                update(Product)
                .where(
                    Product.id == product.id,
                    Product.stock >= item.quantity,
                )
                .values(stock=Product.stock - item.quantity)
                .execution_options(synchronize_session=False)
            )

            if result.rowcount != 1:
                raise HTTPException(
                    status_code=409,
                    detail=f"Insufficient stock: {product.name}.",
                )

            order.items.append(
                OrderItem(
                    product_id=product.id,
                    product_name=product.name,
                    size=item.size,
                    quantity=item.quantity,
                    unit_price_paise=product.price_paise,
                )
            )

            order.total_paise += (
                product.price_paise * item.quantity
            )
            
            db.delete(item)

        db.add(order)
        db.commit()

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()

        # A simultaneous retry may have already created this order.
        existing = db.scalar(
            select(Order).where(
                Order.checkout_key == checkout_key
            )
        )

        if existing is not None:
            return load_order(db, existing.id, current_user.id)

        raise HTTPException(
            status_code=409,
            detail="Checkout conflict. Refresh and try again.",
        )

    return load_order(db, order.id, current_user.id)


@router.get("", response_model=list[OrderResponse])
def order_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
    ).all()


@router.get("/{order_id}", response_model=OrderResponse)
def order_details(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return load_order(db, order_id, current_user.id)

@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = load_order(db, order_id, current_user.id)

    if order.status == "cancelled":
        return order

    if order.status == "paid":
        raise HTTPException(
            status_code=409,
            detail="A paid order cannot be cancelled here.",
        )

    if order.stripe_payment_intent_id is not None:
        raise HTTPException(
            status_code=409,
            detail="This order requires Stripe payment cancellation.",
        )

    result = db.execute(
        update(Order)
        .where(
            Order.id == order_id,
            Order.user_id == current_user.id,
            Order.status.in_(["pending", "payment_failed"]),
            Order.stripe_payment_intent_id.is_(None),
        )
        .values(status="cancelled")
        .execution_options(synchronize_session=False)
    )

    if result.rowcount != 1:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Order changed. Refresh and try again.",
        )

    for item in order.items:
        db.execute(
            update(Product)
            .where(Product.id == item.product_id)
            .values(stock=Product.stock + item.quantity)
            .execution_options(synchronize_session=False)
        )

    db.commit()
    db.expire_all()

    return load_order(db, order_id, current_user.id)
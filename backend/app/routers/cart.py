from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CartItem, Product, User
from app.schemas import (
    CartAdd,
    CartItemResponse,
    CartResponse,
    CartUpdate,
    ProductResponse,
)
from app.security import get_current_user


router = APIRouter(
    prefix="/api/cart",
    tags=["Cart"],
)


def build_cart(db: Session, user_id: int) -> CartResponse:
    rows = db.execute(
        select(CartItem, Product)
        .join(Product, CartItem.product_id == Product.id)
        .where(CartItem.user_id == user_id)
        .order_by(CartItem.id)
    ).all()

    items = [
        CartItemResponse(
            id=item.id,
            product=ProductResponse.model_validate(product),
            size=item.size,
            quantity=item.quantity,
            subtotal_paise=product.price_paise * item.quantity,
        )
        for item, product in rows
    ]

    return CartResponse(
        items=items,
        total_quantity=sum(item.quantity for item in items),
        total_paise=sum(item.subtotal_paise for item in items),
    )


def get_owned_item(
    db: Session,
    item_id: int,
    user_id: int,
) -> CartItem:
    item = db.scalar(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == user_id,
        )
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found.",
        )

    return item


def validate_quantity(
    db: Session,
    user_id: int,
    product: Product,
    quantity: int,
    exclude_item_id: int | None = None,
):
    if quantity > 99:
        raise HTTPException(
            status_code=400,
            detail="Maximum quantity per cart item is 99.",
        )

    query = select(
        func.coalesce(func.sum(CartItem.quantity), 0)
    ).where(
        CartItem.user_id == user_id,
        CartItem.product_id == product.id,
    )

    if exclude_item_id is not None:
        query = query.where(CartItem.id != exclude_item_id)

    other_quantity = db.scalar(query) or 0

    # Product stock is shared across all sizes in this model.
    if other_quantity + quantity > product.stock:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Only {product.stock} units are available "
                "across all sizes of this product."
            ),
        )


def commit_cart(db: Session):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cart changed. Refresh your cart and try again.",
        )


@router.get("", response_model=CartResponse)
def view_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return build_cart(db, current_user.id)


@router.post("/items", response_model=CartResponse)
def add_to_cart(
    data: CartAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.get(Product, data.product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    if data.size not in product.sizes:
        raise HTTPException(
            status_code=400,
            detail="Selected size is unavailable for this product.",
        )

    item = db.scalar(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == product.id,
            CartItem.size == data.size,
        )
    )

    new_quantity = data.quantity
    if item is not None:
        new_quantity += item.quantity

    validate_quantity(
        db,
        current_user.id,
        product,
        new_quantity,
        exclude_item_id=item.id if item is not None else None,
    )

    if item is not None:
        item.quantity = new_quantity
    else:
        db.add(
            CartItem(
                user_id=current_user.id,
                product_id=product.id,
                size=data.size,
                quantity=data.quantity,
            )
        )

    commit_cart(db)
    return build_cart(db, current_user.id)


@router.patch("/items/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: int,
    data: CartUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_owned_item(db, item_id, current_user.id)
    product = db.get(Product, item.product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    validate_quantity(
        db,
        current_user.id,
        product,
        data.quantity,
        exclude_item_id=item.id,
    )

    item.quantity = data.quantity
    commit_cart(db)

    return build_cart(db, current_user.id)


@router.delete("/items/{item_id}", status_code=204)
def remove_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_owned_item(db, item_id, current_user.id)

    db.delete(item)
    commit_cart(db)

    return Response(status_code=204)
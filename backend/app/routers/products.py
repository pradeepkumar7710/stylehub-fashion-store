from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product
from app.schemas import ProductResponse


router = APIRouter(
    prefix="/api/products",
    tags=["Products"],
)


@router.get("", response_model=list[ProductResponse])
def list_products(
    search: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=50),
    featured: bool | None = None,
    sort: Literal["newest", "price_asc", "price_desc"] = "newest",
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = select(Product)

    if search and search.strip():
        # Escape wildcard characters so search treats them literally.
        term = (
            search.strip()
            .replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_")
        )
        pattern = f"%{term}%"

        query = query.where(
            or_(
                Product.name.ilike(pattern, escape="\\"),
                Product.description.ilike(pattern, escape="\\"),
            )
        )

    if category and category.strip():
        query = query.where(
            Product.category == category.strip().lower()
        )

    if featured is not None:
        query = query.where(
            Product.is_featured == featured
        )

    if sort == "price_asc":
        query = query.order_by(
            Product.price_paise.asc(),
            Product.id.asc(),
        )
    elif sort == "price_desc":
        query = query.order_by(
            Product.price_paise.desc(),
            Product.id.asc(),
        )
    else:
        query = query.order_by(Product.id.desc())

    query = query.offset(offset).limit(limit)

    return db.scalars(query).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    return product
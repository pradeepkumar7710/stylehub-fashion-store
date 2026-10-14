from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Product


PRODUCTS = [
    {
        "name": "Classic Cotton T-Shirt",
        "description": (
            "Soft cotton T-shirt with a regular fit for everyday wear."
        ),
        "category": "men",
        "price_paise": 69900,
        "images": [],
        "sizes": ["S", "M", "L", "XL"],
        "colour": "Black",
        "stock": 25,
        "is_featured": True,
    },
    {
        "name": "Oxford Casual Shirt",
        "description": (
            "A versatile button-down shirt for casual and smart looks."
        ),
        "category": "men",
        "price_paise": 149900,
        "images": [],
        "sizes": ["S", "M", "L", "XL"],
        "colour": "Blue",
        "stock": 18,
        "is_featured": True,
    },
    {
        "name": "Floral Midi Dress",
        "description": (
            "Lightweight floral midi dress with a relaxed silhouette."
        ),
        "category": "women",
        "price_paise": 189900,
        "images": [],
        "sizes": ["XS", "S", "M", "L"],
        "colour": "Cream",
        "stock": 15,
        "is_featured": True,
    },
    {
        "name": "Relaxed Fit Jeans",
        "description": (
            "Comfortable denim jeans with a relaxed fit."
        ),
        "category": "women",
        "price_paise": 169900,
        "images": [],
        "sizes": ["26", "28", "30", "32", "34"],
        "colour": "Blue",
        "stock": 20,
        "is_featured": False,
    },
    {
        "name": "Everyday Sneakers",
        "description": (
            "Everyday sneakers with a cushioned sole."
        ),
        "category": "footwear",
        "price_paise": 249900,
        "images": [],
        "sizes": ["6", "7", "8", "9", "10"],
        "colour": "White",
        "stock": 12,
        "is_featured": True,
    },
    {
        "name": "Canvas Tote Bag",
        "description": (
            "Reusable canvas tote with room for your daily essentials."
        ),
        "category": "accessories",
        "price_paise": 49900,
        "images": [],
        "sizes": ["One Size"],
        "colour": "Beige",
        "stock": 30,
        "is_featured": False,
    },
]


def seed_products():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        added = 0

        for data in PRODUCTS:
            existing = db.scalar(
                select(Product).where(
                    Product.name == data["name"]
                )
            )

            if existing:
                continue

            db.add(Product(**data))
            added += 1

        db.commit()

        print(f"Added {added} products successfully.")


if __name__ == "__main__":
    seed_products()
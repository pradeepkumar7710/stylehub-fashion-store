from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Product


PRODUCTS = [
    {
        "name": "Linen Blend Shirt",
        "description": "A lightweight linen blend shirt with a relaxed fit.",
        "category": "men",
        "price_paise": 179900,
        "sizes": ["S", "M", "L", "XL"],
        "colour": "Beige",
        "stock": 22,
        "is_featured": False,
    },
    {
        "name": "Relaxed Chino Trousers",
        "description": "Versatile chinos with a comfortable straight-leg fit.",
        "category": "men",
        "price_paise": 199900,
        "sizes": ["28", "30", "32", "34", "36"],
        "colour": "Olive",
        "stock": 18,
        "is_featured": False,
    },
    {
        "name": "Everyday Pullover Hoodie",
        "description": "A soft pullover hoodie with a front pocket.",
        "category": "men",
        "price_paise": 219900,
        "sizes": ["S", "M", "L", "XL"],
        "colour": "Grey",
        "stock": 16,
        "is_featured": False,
    },
    {
        "name": "Ribbed Knit Top",
        "description": "A fitted ribbed top for effortless layering.",
        "category": "women",
        "price_paise": 89900,
        "sizes": ["XS", "S", "M", "L"],
        "colour": "Ivory",
        "stock": 28,
        "is_featured": False,
    },
    {
        "name": "Pleated Midi Skirt",
        "description": "A flowing pleated skirt with a comfortable waistband.",
        "category": "women",
        "price_paise": 159900,
        "sizes": ["XS", "S", "M", "L"],
        "colour": "Brown",
        "stock": 14,
        "is_featured": False,
    },
    {
        "name": "Relaxed Tailored Blazer",
        "description": "A relaxed blazer with clean lines and a modern silhouette.",
        "category": "women",
        "price_paise": 329900,
        "sizes": ["XS", "S", "M", "L", "XL"],
        "colour": "Black",
        "stock": 10,
        "is_featured": False,
    },
    {
        "name": "Classic Slip-On Loafers",
        "description": "Slip-on loafers for smart everyday styling.",
        "category": "footwear",
        "price_paise": 229900,
        "sizes": ["6", "7", "8", "9", "10"],
        "colour": "Brown",
        "stock": 15,
        "is_featured": False,
    },
    {
        "name": "Everyday Slide Sandals",
        "description": "Easy slide sandals with a cushioned footbed.",
        "category": "footwear",
        "price_paise": 99900,
        "sizes": ["5", "6", "7", "8", "9"],
        "colour": "Black",
        "stock": 24,
        "is_featured": False,
    },
    {
        "name": "Minimal Crossbody Bag",
        "description": "A compact crossbody bag with an adjustable strap.",
        "category": "accessories",
        "price_paise": 129900,
        "sizes": ["One Size"],
        "colour": "Tan",
        "stock": 20,
        "is_featured": False,
    },
    {
        "name": "Classic Baseball Cap",
        "description": "An everyday cotton cap with an adjustable fastening.",
        "category": "accessories",
        "price_paise": 59900,
        "sizes": ["One Size"],
        "colour": "Navy",
        "stock": 32,
        "is_featured": False,
    },
    {
        "name": "Oversized Cotton Polo",
        "description": "A relaxed cotton polo with a soft collar.",
        "category": "men",
        "price_paise": 119900,
        "sizes": ["S", "M", "L", "XL"],
        "colour": "Maroon",
        "stock": 20,
        "is_featured": False,
    },
    {
        "name": "Button Front Cardigan",
        "description": "A lightweight knit cardigan for everyday layering.",
        "category": "women",
        "price_paise": 179900,
        "sizes": ["XS", "S", "M", "L", "XL"],
        "colour": "Sage",
        "stock": 18,
        "is_featured": False,
    },
    {
        "name": "Canvas High-Top Sneakers",
        "description": "Classic canvas high-tops with a lace-up fastening.",
        "category": "footwear",
        "price_paise": 189900,
        "sizes": ["6", "7", "8", "9", "10"],
        "colour": "Black",
        "stock": 16,
        "is_featured": False,
    },
    {
        "name": "Printed Everyday Scarf",
        "description": "A lightweight printed scarf to finish your outfit.",
        "category": "accessories",
        "price_paise": 79900,
        "sizes": ["One Size"],
        "colour": "Multicolour",
        "stock": 25,
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

            if existing is not None:
                continue

            db.add(Product(**data, images=[]))
            added += 1

        db.commit()

        total = len(db.scalars(select(Product)).all())

        print(f"Added {added} products successfully.")
        print(f"Total products in database: {total}")


if __name__ == "__main__":
    seed_products()
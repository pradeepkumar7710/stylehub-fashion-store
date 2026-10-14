from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Product


IMAGE_DIR = (
    Path(__file__).resolve().parent.parent
    / "frontend"
    / "public"
    / "products"
)

PRODUCT_IMAGES = {
    "Classic Cotton T-Shirt": "cotton-tshirt.jpg",
    "Oxford Casual Shirt": "oxford-shirt.jpg",
    "Floral Midi Dress": "floral-dress.jpg",
    "Relaxed Fit Jeans": "relaxed-jeans.jpg",
    "Everyday Sneakers": "everyday-sneakers.jpg",
    "Canvas Tote Bag": "canvas-tote.jpg",
    "Linen Blend Shirt": "linen-shirt.jpg",
    "Relaxed Chino Trousers": "chino-trousers.jpg",
    "Everyday Pullover Hoodie": "pullover-hoodie.jpg",
    "Ribbed Knit Top": "ribbed-top.jpg",
    "Pleated Midi Skirt": "pleated-skirt.jpg",
    "Relaxed Tailored Blazer": "tailored-blazer.jpg",
    "Classic Slip-On Loafers": "slip-on-loafers.jpg",
    "Everyday Slide Sandals": "slide-sandals.jpg",
    "Minimal Crossbody Bag": "crossbody-bag.jpg",
    "Classic Baseball Cap": "baseball-cap.jpg",
    "Oversized Cotton Polo": "cotton-polo.jpg",
    "Button Front Cardigan": "button-cardigan.jpg",
    "Canvas High-Top Sneakers": "high-top-sneakers.jpg",
    "Printed Everyday Scarf": "printed-scarf.jpg",
}


def update_images():
    updated = 0

    with SessionLocal() as db:
        for product_name, filename in PRODUCT_IMAGES.items():
            image_path = IMAGE_DIR / filename

            if not image_path.is_file():
                print(f"Missing image: {filename}")
                continue

            product = db.scalar(
                select(Product).where(Product.name == product_name)
            )

            if product is None:
                print(f"Product not found: {product_name}")
                continue

            product.images = [f"/products/{filename}"]
            updated += 1
            print(f"Updated: {product_name}")

        db.commit()

    print(f"\nUpdated images for {updated} products.")


if __name__ == "__main__":
    update_images()
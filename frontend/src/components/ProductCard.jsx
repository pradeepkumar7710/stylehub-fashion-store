import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#eee9e1]">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#eee9e1] to-[#ddd3c5]">
            <ShoppingBag
              size={42}
              strokeWidth={1}
              className="text-accent/60"
            />
            <span className="text-xs uppercase tracking-[0.2em] text-accent">
              StyleHub collection
            </span>
          </div>
        )}

        {product.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-cream px-3 py-1.5 text-[10px] uppercase tracking-widest">
            The edit
          </span>
        )}

        {product.stock === 0 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1.5 text-xs text-white">
            Out of stock
          </span>
        )}

        <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white transition-colors group-hover:bg-ink group-hover:text-white">
          <ArrowUpRight size={19} />
        </span>
      </div>

      <div className="pt-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
          {product.category} · {product.colour}
        </p>
        <h3 className="mt-2 text-sm font-medium sm:text-base">
          {product.name}
        </h3>
        <p className="mt-2 text-sm">{formatPrice(product.price_paise)}</p>
      </div>
    </Link>
  );
}
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useAuth } from "../context/useAuth";

export default function ProductDetails() {
  const { productId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [failedImages, setFailedImages] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      setLoading(true);
      setError("");
      setSize("");
      setQuantity(1);
      setImageIndex(0);
      setFailedImages([]);

      try {
        const { data } = await api.get(`/api/products/${productId}`, {
          signal: controller.signal,
        });
        setProduct(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProduct();
    return () => controller.abort();
  }, [productId, attempt]);

  async function addToBag() {
    if (!size) {
      toast.error("Please select a size.");
      return;
    }

    if (!user) {
      toast("Sign in to add this piece to your bag.");
      navigate("/login", { state: { from: location } });
      return;
    }

    setAdding(true);

    try {
      await api.post("/api/cart/items", {
        product_id: product.id,
        size,
        quantity,
      });

      toast.success("Added to your bag.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto grid max-w-7xl animate-pulse gap-10 px-6 py-12 md:grid-cols-2">
        <div className="aspect-[4/5] rounded-3xl bg-black/5" />
        <div className="space-y-6 py-8">
          <div className="h-4 w-1/3 rounded bg-black/5" />
          <div className="h-12 w-3/4 rounded bg-black/5" />
          <div className="h-24 rounded bg-black/5" />
          <div className="h-14 rounded-full bg-black/5" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl">Unable to load this piece</h1>
        <p role="alert" className="mt-4 text-sm text-gray-500">{error}</p>
        <button
          onClick={() => setAttempt((value) => value + 1)}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-white"
        >
          Try again
        </button>
        <Link to="/products" className="mt-6 block text-sm underline">
          Back to the collection
        </Link>
      </main>
    );
  }

  const images = product.images || [];
  const currentImage = images[imageIndex];
  const imageAvailable =
    currentImage && !failedImages.includes(currentImage);
  const maxQuantity = Math.min(99, product.stock);
  const available = product.stock > 0 && product.sizes.length > 0;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <Link
        to={`/products?category=${encodeURIComponent(product.category)}`}
        className="mb-8 inline-flex items-center gap-2 text-xs text-gray-500 hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to collection
      </Link>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-[#e8dfd2]">
            {imageAvailable ? (
              <img
                src={currentImage}
                alt={`${product.name} — view ${imageIndex + 1}`}
                className="h-full w-full object-cover"
                onError={() =>
                  setFailedImages((previous) => [...previous, currentImage])
                }
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-5 bg-gradient-to-br from-[#eee9e1] to-[#d7c8b7] px-8 text-center">
                <ShoppingBag size={70} strokeWidth={0.8} className="text-accent" />
                <p className="text-xs uppercase tracking-[0.25em] text-accent">
                  StyleHub collection
                </p>
                <p className="font-serif text-3xl italic">{product.name}</p>
                <p className="text-xs text-gray-500">
                  Product photography coming soon
                </p>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setImageIndex(index)}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={imageIndex === index}
                  className={`h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                    imageIndex === index ? "border-accent" : "border-transparent"
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:py-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-accent">
            {product.category} / The everyday edit
          </p>
          <h1 className="mt-5 text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-5 text-2xl">{formatPrice(product.price_paise)}</p>
          <p className="mt-7 text-sm leading-7 text-gray-500">
            {product.description}
          </p>

          <div className="mt-8 border-y border-black/10 py-5">
            <p className="text-sm">
              <span className="text-gray-500">Colour:</span> {product.colour}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  available ? "bg-emerald-600" : "bg-gray-400"
                }`}
              />
              {available
                ? `${product.stock} available across all sizes`
                : "Currently unavailable"}
            </p>
          </div>

          <fieldset className="mt-7">
            <legend className="mb-4 text-sm font-medium">
              Select size {size && <span className="text-accent">— {size}</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={!available}
                  aria-pressed={size === option}
                  onClick={() => setSize(option)}
                  className={`min-w-12 rounded-xl border px-4 py-3 text-sm transition-colors disabled:opacity-40 ${
                    size === option
                      ? "border-ink bg-ink text-white"
                      : "border-black/15 hover:border-ink"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-8 flex items-center justify-between">
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center rounded-full border border-black/15">
              <button
                aria-label="Decrease quantity"
                disabled={quantity <= 1 || adding}
                onClick={() => setQuantity((value) => value - 1)}
                className="p-3 disabled:opacity-30"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-sm">{quantity}</span>
              <button
                aria-label="Increase quantity"
                disabled={quantity >= maxQuantity || adding}
                onClick={() => setQuantity((value) => value + 1)}
                className="p-3 disabled:opacity-30"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={addToBag}
            disabled={!available || adding || authLoading}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-ink py-4 text-sm text-white transition-colors hover:bg-accent disabled:opacity-50"
          >
            <ShoppingBag size={18} />
            {adding ? "Adding…" : available ? "Add to bag" : "Unavailable"}
          </button>

          <Link
            to="/cart"
            className="mt-4 block text-center text-xs underline underline-offset-4"
          >
            View your bag
          </Link>

          <div className="mt-8 space-y-3 text-xs text-gray-500">
            <p className="flex items-center gap-2">
              <ShieldCheck size={16} /> Secure Stripe test checkout
            </p>
            <p className="flex items-center gap-2">
              <Check size={16} /> Price and availability verified by the store
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../lib/api";
import { formatPrice } from "../lib/format";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCart() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/api/cart", {
          signal: controller.signal,
        });
        setCart(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadCart();
    return () => controller.abort();
  }, [attempt]);

  async function updateQuantity(itemId, quantity) {
    if (busy) return;
    setBusy(true);

    try {
      const { data } = await api.patch(`/api/cart/items/${itemId}`, {
        quantity,
      });
      setCart(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(itemId) {
    if (busy) return;
    setBusy(true);

    try {
      await api.delete(`/api/cart/items/${itemId}`);

      // Refresh totals from the backend after removal.
      setLoading(true);
      setAttempt((value) => value + 1);
      toast.success("Removed from your bag.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-14">
        <div className="h-12 w-56 animate-pulse rounded bg-black/5" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-72 animate-pulse rounded-3xl bg-black/5" />
          <div className="h-72 animate-pulse rounded-3xl bg-black/5" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl">Unable to load your bag</h1>
        <p role="alert" className="mt-4 text-sm text-gray-500">{error}</p>
        <button
          onClick={() => setAttempt((value) => value + 1)}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-white"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!cart?.items.length) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#e8dfd2]">
          <ShoppingBag size={38} strokeWidth={1.2} className="text-accent" />
        </div>
        <p className="mt-7 text-[10px] uppercase tracking-[0.25em] text-accent">
          Room for something new
        </p>
        <h1 className="mt-4 text-4xl tracking-tight">Your bag is empty.</h1>
        <p className="mt-4 text-sm leading-7 text-gray-500">
          Find a piece you love and make it yours.
        </p>
        <Link
          to="/products"
          className="mt-8 inline-flex items-center gap-6 rounded-full bg-ink px-7 py-4 text-sm text-white"
        >
          Explore the collection <ArrowRight size={18} />
        </Link>
      </main>
    );
  }

  const stockProblem = cart.items.some((item) => {
    const productQuantity = cart.items
      .filter((other) => other.product.id === item.product.id)
      .reduce((total, other) => total + other.quantity, 0);

    return productQuantity > item.product.stock;
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <p className="text-[10px] uppercase tracking-[0.25em] text-accent">
        Your personal edit
      </p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <h1 className="text-4xl tracking-tight sm:text-5xl">Shopping bag.</h1>
        <span className="text-sm text-gray-500">
          {cart.total_quantity} items
        </span>
      </div>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="divide-y divide-black/10">
          {cart.items.map((item) => {
            const productQuantity = cart.items
              .filter((other) => other.product.id === item.product.id)
              .reduce((total, other) => total + other.quantity, 0);

            const canIncrease =
              productQuantity < item.product.stock && item.quantity < 99;

            return (
              <article key={item.id} className="flex gap-4 py-6 first:pt-0 sm:gap-6">
                <Link
                  to={`/products/${item.product.id}`}
                  aria-label={`View ${item.product.name}`}
                  className="flex h-36 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8dfd2] sm:h-44 sm:w-32"
                >
                  {item.product.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag size={30} strokeWidth={1} className="text-accent" />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500">
                        {item.product.category}
                      </p>
                      <Link
                        to={`/products/${item.product.id}`}
                        className="mt-2 block text-sm font-medium sm:text-base"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-2 text-xs text-gray-500">
                        {item.product.colour} · Size {item.size}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.product.name}, size ${item.size}`}
                      className="self-start p-1 text-gray-400 hover:text-red-700 disabled:opacity-30"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    {formatPrice(item.product.price_paise)} each
                  </p>

                  {productQuantity > item.product.stock && (
                    <p className="mt-2 text-xs text-red-700">
                      Only {item.product.stock} available across all sizes.
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="flex items-center rounded-full border border-black/15">
                      <button
                        disabled={busy || item.quantity <= 1}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        className="p-2.5 disabled:opacity-30"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-xs">{item.quantity}</span>
                      <button
                        disabled={busy || !canIncrease}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.product.name}`}
                        className="p-2.5 disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.subtotal_paise)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}

          <Link
            to="/products"
            className="inline-flex items-center gap-3 pt-6 text-sm underline underline-offset-4"
          >
            Continue exploring <ArrowRight size={16} />
          </Link>
        </div>

        <aside className="rounded-3xl bg-[#f1ece4] p-7 sm:p-8">
          <h2 className="text-2xl tracking-tight">Order summary</h2>

          <div className="mt-7 flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatPrice(cart.total_paise)}</span>
          </div>
          <p className="mt-4 text-xs leading-6 text-gray-500">
            Demo checkout uses the listed product total.
            No additional delivery charges are applied.
          </p>

          <div className="mt-6 flex justify-between border-t border-black/10 pt-6 text-lg font-medium">
            <span>Total</span>
            <span>{formatPrice(cart.total_paise)}</span>
          </div>

          {stockProblem && (
            <p role="alert" className="mt-5 text-xs leading-6 text-red-700">
              Adjust unavailable quantities before checking out.
            </p>
          )}

          {busy || stockProblem ? (
            <button
              disabled
              className="mt-7 w-full rounded-full bg-ink py-4 text-sm text-white opacity-40"
            >
              {busy ? "Updating bag…" : "Check product availability"}
            </button>
          ) : (
            <Link
              to="/checkout"
              className="mt-7 flex items-center justify-between rounded-full bg-ink px-6 py-4 text-sm text-white transition-colors hover:bg-accent"
            >
              Continue to checkout <ArrowRight size={18} />
            </Link>
          )}

          <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-gray-500">
            <ShieldCheck size={15} /> Secure Stripe test payment
          </p>
        </aside>
      </div>
    </main>
  );
}
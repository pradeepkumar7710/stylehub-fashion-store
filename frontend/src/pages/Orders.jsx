import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Package } from "lucide-react";
import api, { getErrorMessage } from "../lib/api";
import { formatDate, formatPrice } from "../lib/format";

const statusColours = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-800",
  payment_failed: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/api/orders", {
          signal: controller.signal,
        });
        setOrders(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadOrders();
    return () => controller.abort();
  }, [attempt]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <p className="text-[10px] uppercase tracking-[0.25em] text-accent">
        Your StyleHub story
      </p>
      <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">
        Your orders.
      </h1>
      <p className="mt-4 text-sm text-gray-500">
        Every piece, every payment, in one place.
      </p>

      {error && (
        <div role="alert" className="mt-8 rounded-xl bg-red-50 p-5">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-10 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      ) : !error && orders.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-[#f1ece4] py-16 text-center">
          <Package size={36} strokeWidth={1.2} className="mx-auto text-accent" />
          <h2 className="mt-5 text-2xl">Your first order awaits.</h2>
          <Link
            to="/products"
            className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm text-white"
          >
            Explore the collection
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block rounded-2xl border border-black/10 bg-white p-6 transition-colors hover:border-accent"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Order #{order.id}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-[11px] capitalize ${statusColours[order.status] || statusColours.pending}`}>
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>

              <p className="mt-5 truncate text-sm text-gray-500">
                {order.items.map((item) => item.product_name).join(", ")}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
                <p className="text-sm font-medium">
                  {formatPrice(order.total_paise)}
                </p>
                <span className="flex items-center gap-2 text-xs">
                  View order <ArrowUpRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
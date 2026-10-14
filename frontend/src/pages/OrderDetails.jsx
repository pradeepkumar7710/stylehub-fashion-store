import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock3, CircleX, ArrowRight } from "lucide-react";
import api, { getErrorMessage } from "../lib/api";
import { formatDate, formatPrice } from "../lib/format";
import { useAuth } from "../context/useAuth";

const statusInfo = {
  paid: {
    title: "It's yours.",
    text: "Your payment is confirmed. Your order details are below.",
    Icon: CheckCircle2,
    colour: "text-emerald-700 bg-emerald-50",
  },
  pending: {
    title: "Awaiting confirmation.",
    text: "Your order is saved. If you just paid, we're waiting for payment verification.",
    Icon: Clock3,
    colour: "text-amber-700 bg-amber-50",
  },
  payment_failed: {
    title: "Payment needs another try.",
    text: "Your payment was unsuccessful. Your order is saved for retry.",
    Icon: CircleX,
    colour: "text-red-700 bg-red-50",
  },
  cancelled: {
    title: "Order cancelled.",
    text: "This order has been cancelled and its reserved stock released.",
    Icon: CircleX,
    colour: "text-gray-600 bg-gray-100",
  },
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    let checks = 0;

    async function checkOrder() {
      try {
        const { data } = await api.get(`/api/orders/${orderId}`, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setOrder(data);
        setError("");
        checks += 1;

        if (["paid", "cancelled"].includes(data.status)) {
          const key = `stylehub_checkout_${user.id}`;

          if (sessionStorage.getItem(`${key}_order`) === String(data.id)) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_order`);
          }
        }

        if (data.status === "pending" && checks < 15) {
          timer = setTimeout(checkOrder, 2000);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    checkOrder();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [orderId, user.id, attempt]);

  if (loading) {
    return (
      <main className="py-24 text-center text-gray-500">
        Checking your order…
      </main>
    );
  }

  if (!order) {
    return (
      <main className="px-6 py-24 text-center">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => {setLoading(true);setError("");setAttempt((value) => value + 1);}}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-white"
        >
          Try again
        </button>
      </main>
    );
  }

  const info = statusInfo[order.status] || statusInfo.pending;
  const Icon = info.Icon;

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <div className="text-center">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${info.colour}`}>
          <Icon size={36} strokeWidth={1.4} />
        </div>
        <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-accent">
          StyleHub / Order #{order.id}
        </p>
        <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">
          {info.title}
        </h1>
        <p aria-live="polite" className="mx-auto mt-5 max-w-md text-sm leading-7 text-gray-500">
          {info.text}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mt-10 rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap justify-between gap-4 border-b border-black/10 pb-5 text-xs text-gray-500">
          <span>Placed {formatDate(order.created_at)}</span>
          <span className="capitalize">{order.status.replaceAll("_", " ")}</span>
        </div>

        <div className="divide-y divide-black/10">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 py-5">
              <div>
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="mt-2 text-xs text-gray-500">
                  Size {item.size} · Quantity {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm">
                {formatPrice(item.subtotal_paise)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-between border-t border-black/10 pt-5 text-lg font-medium">
          <span>Total</span>
          <span>{formatPrice(order.total_paise)}</span>
        </div>

        {order.paid_at && (
          <p className="mt-4 text-xs text-gray-500">
            Payment confirmed {formatDate(order.paid_at)}
          </p>
        )}
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          to="/orders"
          className="rounded-full border border-black/20 px-6 py-3 text-sm"
        >
          My orders
        </Link>
        <Link
          to="/products"
          className="inline-flex items-center gap-4 rounded-full bg-ink px-6 py-3 text-sm text-white"
        >
          Continue shopping <ArrowRight size={16} />
        </Link>
        {["pending", "payment_failed"].includes(order.status) && (
          <button
            onClick={() => setAttempt((value) => value + 1)}
            className="rounded-full border border-black/20 px-6 py-3 text-sm"
          >
            Refresh payment status
          </button>
        )}
      </div>
    </main>
  );
}
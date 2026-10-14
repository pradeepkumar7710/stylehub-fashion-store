import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useAuth } from "../context/useAuth";
import PaymentForm from "../components/PaymentForm";

const stripeClients = new Map();

function getStripeClient(key) {
  if (!stripeClients.has(key)) {
    stripeClients.set(key, loadStripe(key));
  }

  return stripeClients.get(key);
}

const appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#936448",
    colorBackground: "#ffffff",
    colorText: "#20201e",
    colorDanger: "#b91c1c",
    fontFamily: "Arial, Helvetica, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
};

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const storageKey = `stylehub_checkout_${user.id}`;

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

  async function preparePayment() {
    if (preparing) return;

    setPreparing(true);
    setError("");

    try {
      let key = sessionStorage.getItem(storageKey);

      if (!key) {
        key = crypto.randomUUID();
        sessionStorage.setItem(storageKey, key);
      }

      // Reusing this key returns the same order on retries.
      const { data: createdOrder } = await api.post(
        "/api/orders",
        null,
        {
          headers: { "Idempotency-Key": key },
        },
      );

      if (createdOrder.status === "paid") {
        sessionStorage.removeItem(storageKey);
        navigate(`/orders/${createdOrder.id}`);
        return;
      }

      if (createdOrder.status === "cancelled") {
        sessionStorage.removeItem(storageKey);
        setOrder(null);
        setError(
          "Your previous checkout was cancelled. Click Prepare payment again to start a new order.",
        );
        return;
      }

      setOrder(createdOrder);
      sessionStorage.setItem(
        `${storageKey}_order`,
         String(createdOrder.id),
      );

      const { data: intent } = await api.post(
        `/api/payments/orders/${createdOrder.id}/intent`,
      );

      setPayment(intent);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPreparing(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="h-12 w-64 animate-pulse rounded bg-black/5" />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-3xl bg-black/5" />
          <div className="h-80 animate-pulse rounded-3xl bg-black/5" />
        </div>
      </main>
    );
  }

  if (!cart && error) {
    return (
      <main className="px-6 py-24 text-center">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => setAttempt((value) => value + 1)}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-white"
        >
          Try again
        </button>
      </main>
    );
  }

  if (
  !cart?.items.length &&
  !order &&
  !sessionStorage.getItem(storageKey)
) {
    return (
      <main className="px-6 py-24 text-center">
        <h1 className="text-3xl">Your bag is empty.</h1>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm text-white"
        >
          Explore the collection
        </Link>
      </main>
    );
  }

  const summaryItems = order
    ? order.items
    : cart.items.map((item) => ({
        id: item.id,
        product_name: item.product.name,
        size: item.size,
        quantity: item.quantity,
        subtotal_paise: item.subtotal_paise,
      }));

  const total = order ? order.total_paise : cart.total_paise;

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-xs text-gray-500"
      >
        <ArrowLeft size={15} /> Back to bag
      </Link>

      <p className="mt-8 text-[10px] uppercase tracking-[0.25em] text-accent">
        One step closer
      </p>
      <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">
        Make it yours.
      </h1>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-9">
          {payment ? (
            <Elements
              key={payment.payment_intent_id}
              stripe={getStripeClient(payment.publishable_key)}
              options={{
                clientSecret: payment.client_secret,
                appearance,
              }}
            >
              <PaymentForm order={order} />
            </Elements>
          ) : (
            <>
              <h2 className="text-2xl tracking-tight">
                Review your order
              </h2>
              <p className="mt-4 text-sm leading-7 text-gray-500">
                Preparing payment reserves these items and locks in
                your order total. Retrying resumes the same checkout.
              </p>

              <div className="mt-6 rounded-2xl bg-cream p-5">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="mt-2 text-sm font-medium">{user.name}</p>
                <p className="mt-1 text-sm text-gray-500">{user.email}</p>
              </div>

              <button
                onClick={preparePayment}
                disabled={preparing}
                className="mt-7 flex w-full items-center justify-between rounded-full bg-ink px-6 py-4 text-sm text-white transition-colors hover:bg-accent disabled:opacity-50"
              >
                {preparing ? "Preparing secure checkout…" : "Prepare payment"}
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </section>

        <aside className="rounded-3xl bg-[#f1ece4] p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl tracking-tight">Your edit</h2>
            {order && (
              <span className="text-xs text-gray-500">Order #{order.id}</span>
            )}
          </div>

          <div className="mt-6 divide-y divide-black/10">
            {summaryItems.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 py-4">
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

          <div className="mt-5 flex justify-between border-t border-black/15 pt-6 text-lg font-medium">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <p className="mt-6 flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck size={17} /> Secure Stripe test checkout
          </p>
          <p className="mt-3 text-xs leading-6 text-gray-500">
            No real money is charged. Order confirmation follows
            verification by the backend.
          </p>
        </aside>
      </div>
    </main>
  );
}
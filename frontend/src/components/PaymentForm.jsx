import { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../lib/format";

export default function PaymentForm({ order }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/${order.id}`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setError(result.error.message || "Payment could not be completed.");
        return;
      }

      if (
        result.paymentIntent?.status === "succeeded" ||
        result.paymentIntent?.status === "processing"
      ) {
        // The order page will verify the backend's payment status.
        navigate(`/orders/${order.id}`, { replace: true });
        return;
      }

      setError(
        "Payment is not complete yet. Check your payment details and try again.",
      );
    } catch {
      setError(
        "We couldn't confirm the payment status. Check your order before trying again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl tracking-tight">Payment details</h2>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-medium text-amber-800">
          TEST MODE
        </span>
      </div>

      {!ready && !loadFailed && (
        <p className="mb-5 animate-pulse text-sm text-gray-500">
          Loading secure payment form…
        </p>
      )}

      <PaymentElement
        options={{ layout: "tabs" }}
        onReady={() => setReady(true)}
        onLoadError={() => {
          setLoadFailed(true);
          setError(
            "The payment form couldn't load. Check your connection and refresh.",
          );
        }}
      />

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || !ready || loadFailed || submitting}
        className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-ink px-6 py-4 text-sm text-white transition-colors hover:bg-accent disabled:opacity-40"
      >
        <LockKeyhole size={17} />
        {submitting
          ? "Processing payment…"
          : `Pay ${formatPrice(order.total_paise)}`}
      </button>

      <p className="mt-4 text-center text-[11px] leading-6 text-gray-500">
        Secure payment through Stripe. This demo uses test payments.
      </p>
    </form>
  );
}
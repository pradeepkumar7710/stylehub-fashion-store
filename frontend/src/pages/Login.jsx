import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth";
import { getErrorMessage } from "../lib/api";

export default function Login() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from;
  const destination =
    from?.pathname?.startsWith("/") &&
    !from.pathname.startsWith("//") &&
    !["/login", "/register"].includes(from.pathname)
      ? `${from.pathname}${from.search || ""}`
      : "/products";

  if (loading) {
    return (
      <main className="py-24 text-center text-gray-500">
        Checking your session…
      </main>
    );
  }

  if (user) return <Navigate to={destination} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email.trim(), password);
      toast.success("Welcome back!");
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="grid overflow-hidden rounded-3xl border border-black/10 bg-white lg:grid-cols-2">
        <div className="relative hidden min-h-[620px] bg-[#e8dfd2] lg:block">
          <img
            src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=85"
            alt="Clothing collection"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          <div className="absolute bottom-12 left-10 right-10 text-white">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">
              Your next favourite awaits
            </p>
            <h2 className="mt-5 text-5xl leading-tight tracking-tight">
              Your style.
              <br />
              <span className="font-serif italic">Your space.</span>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/75">
              Sign in to save your bag, discover the collection,
              and keep track of your orders.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-14 sm:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-accent">
              <LockKeyhole size={23} strokeWidth={1.4} />
            </div>

            <p className="text-[10px] uppercase tracking-[0.25em] text-accent">
              Welcome to StyleHub
            </p>
            <h1 className="mt-3 text-4xl tracking-tight">Welcome back.</h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Sign in and pick up where you left off.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-xs font-medium">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  disabled={submitting}
                  className="w-full rounded-xl border border-black/15 bg-cream/40 px-4 py-3.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-xs font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={submitting}
                    aria-describedby={error ? "login-error" : undefined}
                    className="w-full rounded-xl border border-black/15 bg-cream/40 py-3.5 pl-4 pr-12 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  id="login-error"
                  role="alert"
                  className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-between rounded-full bg-ink px-6 py-4 text-sm text-white transition-colors hover:bg-accent disabled:opacity-50"
              >
                {submitting ? "Signing in…" : "Sign in"}
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              New to StyleHub?{" "}
              <Link
                to="/register"
                state={location.state}
                className="font-medium text-ink underline underline-offset-4"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
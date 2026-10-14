import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth";
import { getErrorMessage } from "../lib/api";

export default function Register() {
  const { user, loading, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter a name with at least two characters.");
      return;
    }

    if (
      password.length < 8 ||
      new TextEncoder().encode(password).length > 72
    ) {
      setError("Use at least 8 characters and no more than 72 bytes.");
      return;
    }

    if (!/\p{L}/u.test(password) || !/\p{Nd}/u.test(password)) {
      setError("Include at least one letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register(name.trim(), email.trim(), password);
      toast.success("Your StyleHub account is ready!");
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="py-24 text-center text-gray-500">
        Checking your session…
      </main>
    );
  }

  if (user) return <Navigate to={destination} replace />;

  const inputClass =
    "w-full rounded-xl border border-black/15 bg-cream/40 px-4 py-3.5 text-sm";

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="grid overflow-hidden rounded-3xl border border-black/10 bg-white lg:grid-cols-2">
        <div className="relative hidden min-h-[720px] bg-[#e8dfd2] lg:block">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85"
            alt="Fashion shopping inspiration"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
          <div className="absolute bottom-12 left-10 right-10 text-white">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">
              Make room for your favourites
            </p>
            <h2 className="mt-5 text-5xl leading-tight tracking-tight">
              A fresh start.
              <br />
              <span className="font-serif italic">Your own style.</span>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/75">
              Create your account, build your bag, and follow
              every order in one place.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-accent">
              <Sparkles size={23} strokeWidth={1.4} />
            </div>

            <p className="text-[10px] uppercase tracking-[0.25em] text-accent">
              Join the everyday edit
            </p>
            <h1 className="mt-3 text-4xl tracking-tight">
              Make it yours.
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Create your StyleHub account.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label
                  htmlFor="register-name"
                  className="mb-2 block text-xs font-medium"
                >
                  Your name
                </label>
                <input
                  id="register-name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-xs font-medium"
                >
                  Email address
                </label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-xs font-medium"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={submitting}
                    aria-describedby="password-help"
                    className={`${inputClass} pr-12`}
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
                <p id="password-help" className="mt-2 text-[11px] text-gray-500">
                  At least 8 characters, including a letter and a number.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-xs font-medium"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>

              {error && (
                <p
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
                {submitting ? "Creating account…" : "Create account"}
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                state={location.state}
                className="font-medium text-ink underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
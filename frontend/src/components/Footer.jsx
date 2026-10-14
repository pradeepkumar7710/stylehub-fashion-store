import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:px-8 md:grid-cols-2">
        <div>
          <Link
            to="/"
            className="text-4xl font-semibold tracking-[-0.08em]"
          >
            STYLE<span className="font-light">HUB</span>.
          </Link>

          <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
            A fresh perspective on everyday dressing.
            Discover pieces that feel like you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="mb-5 text-xs uppercase tracking-[0.2em] text-white/40">
              Explore
            </h2>
            {[
              ["All products", "/products"],
              ["Women", "/products?category=women"],
              ["Men", "/products?category=men"],
              ["Footwear", "/products?category=footwear"],
            ].map(([label, to]) => (
              <Link
                key={label}
                to={to}
                className="mb-3 block text-sm text-white/75 transition-colors hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>

          <div>
            <h2 className="mb-5 text-xs uppercase tracking-[0.2em] text-white/40">
              Your account
            </h2>
            {[
              ["My orders", "/orders"],
              ["Shopping bag", "/cart"],
              ["Sign in", "/login"],
            ].map(([label, to]) => (
              <Link
                key={label}
                to={to}
                className="mb-3 flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-white"
              >
                {label}
                <ArrowUpRight size={13} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 px-6 py-6 text-xs text-white/40 sm:flex-row sm:px-8">
        <p>© {new Date().getFullYear()} StyleHub.</p>
        <p>Demo store · Payments processed in Stripe test mode</p>
      </div>
    </footer>
  );
}
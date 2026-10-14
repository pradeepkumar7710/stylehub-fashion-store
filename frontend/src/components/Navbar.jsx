import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu, ShoppingBag, User, X } from "lucide-react";
import { useAuth } from "../context/useAuth";

const categories = [
  { label: "Shop all", to: "/products" },
  { label: "Women", to: "/products?category=women" },
  { label: "Men", to: "/products?category=men" },
  { label: "Accessories", to: "/products?category=accessories" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!menuOpen) return;

    function handleKey(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-cream/95 backdrop-blur-xl">
      <div className="bg-ink px-4 py-2 text-center text-[11px] tracking-[0.15em] text-white">
        THE EVERYDAY EDIT — CONSIDERED STYLE, EFFORTLESSLY YOURS
      </div>

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          to="/"
          className="text-3xl font-semibold tracking-[-0.08em]"
          aria-label="StyleHub home"
        >
          STYLE<span className="font-light">HUB</span>
          <span className="text-accent">.</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {categories.map((item) => {
            const active =
              location.pathname === "/products" &&
              location.search === (item.to.split("?")[1] ? `?${item.to.split("?")[1]}` : "");

            return (
              <Link
                key={item.label}
                to={item.to}
                className={`border-b py-2 text-sm transition-colors ${
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-gray-600 hover:border-ink hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to={user ? "/orders" : "/login"}
            aria-label={user ? "My orders" : "Sign in"}
            className="flex items-center gap-2 transition-colors hover:text-accent"
          >
            <User size={20} strokeWidth={1.5} />
            <span className="hidden max-w-24 truncate text-xs sm:block">
              {user ? user.name.split(" ")[0] : "Sign in"}
            </span>
          </Link>

          <Link
            to="/cart"
            aria-label="Shopping bag"
            className="transition-colors hover:text-accent"
          >
            <ShoppingBag size={21} strokeWidth={1.5} />
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="lg:hidden"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
          {user && (
            <button
              type="button"
              onClick={logout}
              className="hidden text-xs text-gray-500 hover:text-ink lg:block"
            >
              Sign out
            </button>
           )}
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-black/10 px-5 py-5 lg:hidden"
        >
          {categories.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center justify-between border-b border-black/5 py-4 text-lg"
            >
              {item.label}
              <ArrowUpRight size={18} />
            </Link>
          ))}

          {user && (
            <>
              <NavLink to="/orders" className="block py-4 text-sm">
                My orders
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="py-2 text-sm text-gray-500"
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
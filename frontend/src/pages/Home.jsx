import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, LockKeyhole, Layers3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../lib/api";
import ProductCard from "../components/ProductCard";

const categories = [
  {
    name: "Women",
    value: "women",
    subtitle: "A fresh point of view",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Men",
    value: "men",
    subtitle: "Everyday, redefined",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Footwear",
    value: "footwear",
    subtitle: "Find your next step",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85",
  },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeatured() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/api/products", {
          params: { featured: true, limit: 4 },
          signal: controller.signal,
        });
        setProducts(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadFeatured();
    return () => controller.abort();
  }, [attempt]);

  return (
    <main>
      <section className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="grid overflow-hidden rounded-[24px] bg-[#e8dfd2] lg:min-h-[600px] lg:grid-cols-2">
          <div className="flex flex-col justify-center px-7 py-14 sm:px-14 lg:py-20">
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              The everyday collection
            </p>

            <h1 className="mt-7 text-5xl leading-[1.06] tracking-[-0.055em] sm:text-7xl">
              Less ordinary.
              <br />
              <span className="font-serif italic text-accent">
                More you.
              </span>
            </h1>

            <p className="mt-7 max-w-sm text-sm leading-7 text-ink/65">
              Fresh silhouettes. Easy essentials. Discover your next
              favourite piece and make everyday dressing your own.
            </p>

            <Link
              to="/products"
              className="mt-9 inline-flex w-fit items-center gap-8 rounded-full bg-ink px-7 py-4 text-sm text-white transition-colors hover:bg-accent"
            >
              Explore the collection
              <ArrowRight size={18} />
            </Link>

            <p className="mt-10 text-[10px] uppercase tracking-[0.2em] text-ink/45">
              Modern essentials / Individual expression
            </p>
          </div>

          <div className="relative min-h-[360px] bg-[#c5b3a2] lg:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=90"
              alt="Fashion collection displayed on a clothing rail"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />

            <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between text-white">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em]">
                  Curated for your everyday
                </p>
                <p className="mt-2 font-serif text-3xl italic">
                  Wear your perspective.
                </p>
              </div>
              <Link
                to="/products"
                aria-label="Explore all products"
                className="rounded-full border border-white/60 p-3 transition-colors hover:bg-white hover:text-ink"
              >
                <ArrowUpRight size={23} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:py-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent">
              Discover your direction
            </p>
            <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
              Shop by category
            </h2>
          </div>
          <Link
            to="/products"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            View all <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.value}
              to={`/products?category=${category.value}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#ddd3c5]"
            >
              <img
                src={category.image}
                alt={`${category.name} fashion inspiration`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
                <div>
                  <p className="text-xs text-white/75">
                    {category.subtitle}
                  </p>
                  <h3 className="mt-2 text-3xl">{category.name}</h3>
                </div>
                <ArrowUpRight size={24} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-black/10 bg-[#f1ece4]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 sm:grid-cols-3 sm:px-8">
          {[
            [Sparkles, "Find your style", "Discover the everyday edit"],
            [Layers3, "Make it yours", "Choose your fit and colour"],
            [LockKeyhole, "Secure checkout", "Powered by Stripe · Test mode"],
          ].map(([Icon, title, text]) => (
            <div key={title} className="flex items-center gap-4">
              <Icon size={24} strokeWidth={1.3} className="text-accent" />
              <div>
                <h3 className="text-sm font-medium">{title}</h3>
                <p className="mt-1 text-xs text-gray-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pt-16 sm:px-8 lg:pt-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent">
              Selected for you
            </p>
            <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
              The featured edit
            </h2>
          </div>
          <Link to="/products" className="text-sm underline underline-offset-4">
            Shop all
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="aspect-[3/4] rounded-2xl bg-black/5" />
                <div className="mt-4 h-3 w-3/4 rounded bg-black/5" />
                <div className="mt-3 h-3 w-1/3 rounded bg-black/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-black/10 p-8 text-center">
            <p className="text-sm text-gray-600">{error}</p>
            <button
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-4 rounded-full bg-ink px-6 py-3 text-sm text-white"
            >
              Try again
            </button>
          </div>
        ) : products.length ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-gray-500">
            Featured products will appear here when available.
          </p>
        )}
      </section>
    </main>
  );
}
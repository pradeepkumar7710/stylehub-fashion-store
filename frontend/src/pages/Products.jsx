import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, ArrowRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api, { getErrorMessage } from "../lib/api";
import ProductCard from "../components/ProductCard";

const PAGE_SIZE = 12;

const categories = [
  ["", "All pieces"],
  ["women", "Women"],
  ["men", "Men"],
  ["footwear", "Footwear"],
  ["accessories", "Accessories"],
];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const requestedSort = params.get("sort") || "newest";
  const sort = ["newest", "price_asc", "price_desc"].includes(requestedSort)
    ? requestedSort
    : "newest";

  const [draftSearch, setDraftSearch] = useState(search);
  const [products, setProducts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);


  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/api/products", {
          params: {
            search: search || undefined,
            category: category || undefined,
            sort,
            offset,
            limit: PAGE_SIZE,
          },
          signal: controller.signal,
        });

        setProducts((previous) =>
          offset === 0 ? data : [...previous, ...data],
        );
        setHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, [search, category, sort, offset, attempt]);

  function updateFilters(changes) {
    const next = new URLSearchParams(params);

    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });

    setOffset(0);
    setProducts([]);
    setHasMore(false);
    setLoading(true);
    setParams(next);
    setAttempt((value) => value + 1);
  }

  function submitSearch(event) {
    event.preventDefault();
    updateFilters({ search: draftSearch.trim() });
  }

  function resetFilters() {
    setDraftSearch("");
    setOffset(0);
    setProducts([]);
    setHasMore(false);
    setLoading(true);
    setParams({});
    setAttempt((value) => value + 1);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="border-b border-black/10 pb-10">
        <p className="text-[10px] uppercase tracking-[0.25em] text-accent">
          The StyleHub collection
        </p>

        <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <h1 className="text-5xl tracking-[-0.04em] sm:text-6xl">
            Find your favourites.
          </h1>
          <p className="max-w-xs text-sm leading-6 text-gray-500">
            Easy essentials and standout pieces.
            A wardrobe that feels like you.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-between gap-5 lg:flex-row">
        <div className="flex flex-wrap gap-2" aria-label="Product categories">
          {categories.map(([value, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={category === value}
              onClick={() => updateFilters({ category: value })}
              className={`rounded-full border px-5 py-2.5 text-xs transition-colors ${
                category === value
                  ? "border-ink bg-ink text-white"
                  : "border-black/10 bg-transparent hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3 text-xs text-gray-500">
          <SlidersHorizontal size={16} />
          <span className="sr-only">Sort products</span>
          <select
            value={sort}
            onChange={(event) =>
              updateFilters({ sort: event.target.value })
            }
            className="rounded-lg border border-black/10 bg-cream px-3 py-2.5 text-ink"
          >
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <form onSubmit={submitSearch} className="mt-6 flex max-w-xl gap-2">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search your next favourite…"
            value={draftSearch}
            maxLength={100}
            onChange={(event) => setDraftSearch(event.target.value)}
            className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-ink px-6 text-sm text-white transition-colors hover:bg-accent"
        >
          Search
        </button>
      </form>

      <div className="my-7 flex items-center justify-between text-xs text-gray-500">
        <p aria-live="polite">
          {loading && offset === 0
            ? "Finding your pieces…"
            : `${products.length} pieces loaded`}
          {search && ` for “${search}”`}
        </p>

        {(search || category || sort !== "newest") && (
          <button
            type="button"
            onClick={resetFilters}
            className="underline underline-offset-4"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 text-sm underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {loading && offset === 0 ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[3/4] rounded-2xl bg-black/5" />
              <div className="mt-4 h-3 w-3/4 rounded bg-black/5" />
              <div className="mt-3 h-3 w-1/3 rounded bg-black/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="rounded-2xl bg-[#f1ece4] px-6 py-20 text-center">
          <Search size={30} strokeWidth={1.2} className="mx-auto text-accent" />
          <h2 className="mt-5 text-2xl">No matching pieces</h2>
          <p className="mt-3 text-sm text-gray-500">
            Try another search or explore the whole collection.
          </p>
          <button
            onClick={resetFilters}
            className="mt-6 rounded-full bg-ink px-6 py-3 text-sm text-white"
          >
            View all products
          </button>
        </div>
      )}

      {hasMore && !error && (
        <div className="mt-12 text-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => setOffset((value) => value + PAGE_SIZE)}
            className="inline-flex items-center gap-5 rounded-full border border-ink px-8 py-3.5 text-sm transition-colors hover:bg-ink hover:text-white disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
            <ArrowRight size={17} />
          </button>
        </div>
      )}
    </main>
  );
}
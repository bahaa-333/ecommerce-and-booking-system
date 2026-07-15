import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { apiGet } from "../../lib/api";
import { usePaginatedFetch } from "../../lib/usePaginatedFetch";
import BusinessCard from "../../components/customer/BusinessCard";
import { CardSkeleton } from "../../components/Skeleton";
import Pagination from "../../components/Pagination";

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type") ?? "";
  const search = searchParams.get("search") ?? "";

  const [query, setQuery] = useState(search);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    apiGet("business-types", { signal: controller.signal })
      .then((res) => setCategories(res.data))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setQuery(search);
  }, [search]);

  const {
    data: tenants,
    meta,
    loading,
    setPage,
  } = usePaginatedFetch("tenants", {
    params: { business_type: type || undefined, search: search || undefined },
  });

  function handleSearchSubmit(e) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (query.trim()) next.set("search", query.trim());
    else next.delete("search");
    setSearchParams(next);
  }

  function selectType(slug) {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("type", slug);
    else next.delete("type");
    setSearchParams(next);
  }

  const activeCategory = categories.find((c) => c.slug === type);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Discover businesses</h1>
      <p className="mt-1 text-sm text-gray-400">
        {activeCategory ? `Browsing ${activeCategory.name}` : "Every active business on the platform."}
      </p>

      <form onSubmit={handleSearchSubmit} className="mt-6 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 sm:max-w-md">
        <Search className="h-4 w-4 shrink-0 text-gray-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search businesses…"
          className="w-full text-sm placeholder:text-gray-300 focus:outline-none"
        />
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectType("")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !type ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectType(c.slug)}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: type === c.slug ? c.color : `${c.color}55` }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading && Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        {!loading && tenants.map((tenant) => <BusinessCard key={tenant.id} tenant={tenant} />)}
      </div>

      {!loading && tenants.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-400">No businesses match.</p>
      )}

      {!loading && <div className="mt-6"><Pagination meta={meta} onPageChange={setPage} /></div>}
    </div>
  );
}

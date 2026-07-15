import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Store } from "lucide-react";
import { usePaginatedFetch } from "../../lib/usePaginatedFetch";
import ProductCard from "../../components/customer/ProductCard";
import ServiceCard from "../../components/customer/ServiceCard";
import { CardSkeleton } from "../../components/Skeleton";
import Pagination from "../../components/Pagination";

export default function Storefront() {
  const { tenant } = useOutletContext();
  const color = tenant.business_type?.color ?? "#f5a623";
  const [tab, setTab] = useState("products");

  const products = usePaginatedFetch(`tenants/${tenant.slug}/products`);
  const services = usePaginatedFetch(`tenants/${tenant.slug}/services`);

  const active = tab === "products" ? products : services;

  return (
    <div>
      <div className="overflow-hidden rounded-3xl" style={{ backgroundColor: `${color}1a` }}>
        <div className="flex h-48 items-center justify-center sm:h-64">
          {tenant.cover_image_url ? (
            <img src={tenant.cover_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Store className="h-12 w-12" style={{ color }} />
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{tenant.name}</h1>
          {tenant.business_type && (
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              {tenant.business_type.name}
            </span>
          )}
        </div>
        {tenant.intro_text && <p className="mt-3 max-w-2xl text-sm text-gray-500">{tenant.intro_text}</p>}
      </div>

      <div className="mt-8 flex rounded-full bg-gray-100 p-1 text-sm font-medium w-fit">
        <button
          type="button"
          onClick={() => setTab("products")}
          className={`rounded-full px-5 py-2 transition-colors ${
            tab === "products" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Products
        </button>
        <button
          type="button"
          onClick={() => setTab("services")}
          className={`rounded-full px-5 py-2 transition-colors ${
            tab === "services" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Services
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {active.loading &&
          Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        {!active.loading &&
          tab === "products" &&
          active.data.map((product) => (
            <ProductCard key={product.id} product={product} tenantSlug={tenant.slug} color={color} />
          ))}
        {!active.loading &&
          tab === "services" &&
          active.data.map((service) => (
            <ServiceCard key={service.id} service={service} tenantSlug={tenant.slug} color={color} />
          ))}
      </div>

      {!active.loading && active.data.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-400">
          No {tab} yet.
        </p>
      )}

      {!active.loading && (
        <div className="mt-6">
          <Pagination meta={active.meta} onPageChange={active.setPage} />
        </div>
      )}
    </div>
  );
}

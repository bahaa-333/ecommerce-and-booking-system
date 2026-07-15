import { Link } from "react-router-dom";
import { Store } from "lucide-react";

export default function BusinessCard({ tenant, className = "" }) {
  const color = tenant.business_type?.color ?? "#f5a623";

  return (
    <Link
      to={`/store/${tenant.slug}`}
      className={`block shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex h-32 items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
        {tenant.cover_image_url ? (
          <img src={tenant.cover_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Store className="h-8 w-8" style={{ color }} />
        )}
      </div>
      <div className="p-4">
        <div className="font-semibold text-gray-900">{tenant.name}</div>
        {tenant.business_type && (
          <span
            className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            {tenant.business_type.name}
          </span>
        )}
        {tenant.intro_text && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-400">{tenant.intro_text}</p>
        )}
      </div>
    </Link>
  );
}

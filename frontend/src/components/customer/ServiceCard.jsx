import { Link } from "react-router-dom";
import { Clock, Sparkles } from "lucide-react";

export default function ServiceCard({ service, tenantSlug, color = "#f5a623" }) {
  const image = service.images?.[0]?.url;

  return (
    <Link
      to={`/store/${tenantSlug}/services/${service.id}`}
      className="block overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-md"
    >
      <div className="flex aspect-square items-center justify-center bg-gray-50">
        {image ? (
          <img src={image} alt={service.name} className="h-full w-full object-cover" />
        ) : (
          <Sparkles className="h-8 w-8 text-gray-300" />
        )}
      </div>
      <div className="p-4">
        <div className="font-medium text-gray-900">{service.name}</div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color }}>
            ${Number(service.price).toFixed(2)}
          </span>
          {service.duration_value && service.duration_unit && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {service.duration_value} {service.duration_unit}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

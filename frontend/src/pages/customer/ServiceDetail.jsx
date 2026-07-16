import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { Clock, Sparkles, Users } from "lucide-react";
import { apiGet } from "../../lib/api";
import DetailSkeleton from "../../components/customer/DetailSkeleton";

export default function ServiceDetail() {
  const { tenant } = useOutletContext();
  const { serviceId } = useParams();
  const color = tenant.business_type?.color ?? "#f5a623";

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    apiGet(`tenants/${tenant.slug}/services/${serviceId}`, { signal: controller.signal })
      .then((data) => {
        setService(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tenant.slug, serviceId]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!service) {
    return <div className="py-24 text-center text-sm text-gray-400">Service not found.</div>;
  }

  const images = service.images ?? [];

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div>
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-50">
          {images[activeImage] ? (
            <img src={images[activeImage].url} alt={service.name} className="h-full w-full object-cover" />
          ) : (
            <Sparkles className="h-12 w-12 text-gray-300" />
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {images.map((image, i) => (
              <button
                key={image.id ?? i}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${
                  activeImage === i ? "border-gray-900" : "border-transparent"
                }`}
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{service.name}</h1>
        <div className="mt-2 text-xl font-semibold" style={{ color }}>
          ${Number(service.price).toFixed(2)}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          {service.duration_value && service.duration_unit && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {service.duration_value} {service.duration_unit}
            </span>
          )}
          {service.capacity && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Up to {service.capacity} at a time
            </span>
          )}
        </div>

        {service.description && <p className="mt-4 text-sm leading-relaxed text-gray-500">{service.description}</p>}

        {service.advance_booking_value && service.advance_booking_unit && (
          <p className="mt-4 text-xs text-gray-400">
            Requires at least {service.advance_booking_value} {service.advance_booking_unit} advance notice.
          </p>
        )}

        <Link
          to={`/store/${tenant.slug}/services/${service.id}/book`}
          className="mt-6 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          Book now
        </Link>
      </div>
    </div>
  );
}

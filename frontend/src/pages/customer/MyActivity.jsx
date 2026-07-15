import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Package } from "lucide-react";
import { apiGet } from "../../lib/api";
import StatusBadge from "../../components/StatusBadge";
import { Skeleton } from "../../components/Skeleton";

export default function MyActivity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiGet("my-orders", { signal: controller.signal }),
      apiGet("my-bookings", { signal: controller.signal }),
    ])
      .then(([orders, bookings]) => {
        const merged = [
          ...orders.map((o) => ({ ...o, type: "order", sortKey: o.placed_at })),
          ...bookings.map((b) => ({ ...b, type: "booking", sortKey: b.starts_at })),
        ].sort((a, b) => new Date(b.sortKey) - new Date(a.sortKey));
        setActivity(merged);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">My Orders &amp; Bookings</h1>
      <p className="mt-1 text-sm text-gray-400">Everything you&apos;ve ordered or booked, across every business.</p>

      <div className="mt-6 space-y-3">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}

        {!loading && activity.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">Nothing here yet.</p>
        )}

        {!loading &&
          activity.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              to={`/store/${item.tenant.slug}/${item.type === "order" ? "orders" : "bookings"}/${item.id}`}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 hover:border-gray-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                {item.type === "booking" ? <CalendarClock className="h-5 w-5" /> : <Package className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900">{item.tenant.name}</div>
                <div className="text-xs text-gray-400">
                  {item.type === "order"
                    ? new Date(item.placed_at).toLocaleDateString(undefined, { dateStyle: "medium" })
                    : new Date(item.starts_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  {item.type === "order" && ` · $${Number(item.total_amount).toFixed(2)}`}
                </div>
              </div>
              <StatusBadge status={item.status} />
            </Link>
          ))}
      </div>
    </div>
  );
}

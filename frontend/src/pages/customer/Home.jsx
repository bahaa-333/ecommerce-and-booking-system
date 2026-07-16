import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Package } from "lucide-react";
import { apiGet } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import CategoryCard from "../../components/customer/CategoryCard";
import BusinessCard from "../../components/customer/BusinessCard";
import { Skeleton } from "../../components/Skeleton";
import StatusBadge from "../../components/StatusBadge";

function ActivityCard({ item }) {
  const isBooking = item.type === "booking";
  const dateLabel = isBooking
    ? new Date(item.starts_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : new Date(item.placed_at).toLocaleDateString(undefined, { dateStyle: "medium" });

  return (
    <Link
      to={`/store/${item.tenant.slug}`}
      className="flex shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4"
      style={{ width: 260 }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {isBooking ? <CalendarClock className="h-5 w-5" /> : <Package className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-gray-900">{item.tenant.name}</div>
        <div className="truncate text-xs text-gray-400">{dateLabel}</div>
      </div>
      <StatusBadge status={item.status} />
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    apiGet("business-types", { signal: controller.signal })
      .then((res) => {
        setCategories(res.data);
        setCategoriesLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCategoriesLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    apiGet("tenants?random=1&limit=10", { signal: controller.signal })
      .then((data) => {
        setBusinesses(data);
        setBusinessesLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setBusinessesLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!user) {
      setActivityLoading(false);
      return;
    }
    const controller = new AbortController();
    Promise.all([
      apiGet("my-orders?upcoming=1", { signal: controller.signal }),
      apiGet("my-bookings?upcoming=1", { signal: controller.signal }),
    ])
      .then(([orders, bookings]) => {
        const merged = [
          ...orders.map((o) => ({ ...o, type: "order", sortKey: o.placed_at })),
          ...bookings.map((b) => ({ ...b, type: "booking", sortKey: b.starts_at })),
        ].sort((a, b) => new Date(a.sortKey) - new Date(b.sortKey));
        setActivity(merged);
        setActivityLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setActivityLoading(false);
      });
    return () => controller.abort();
  }, [user]);

  return (
    <div>
      <section>
        <h1 className="text-2xl font-semibold text-gray-900">What are you looking for?</h1>
        <p className="mt-1 text-sm text-gray-400">Browse businesses by category.</p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categoriesLoading
            ? Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))
            : categories.map((businessType) => (
                <CategoryCard key={businessType.id} businessType={businessType} />
              ))}
        </div>
      </section>

      {user && activityLoading && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming bookings &amp; orders</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-64 shrink-0 rounded-2xl" />
            ))}
          </div>
        </section>
      )}

      {user && !activityLoading && activity.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming bookings &amp; orders</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {activity.map((item) => (
              <ActivityCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Discover businesses</h2>
          <Link to="/discover" className="text-sm font-medium text-[#f5a623] hover:underline">
            See all
          </Link>
        </div>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {businessesLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-64 shrink-0 rounded-2xl" />
              ))
            : businesses.map((tenant) => (
                <BusinessCard key={tenant.id} tenant={tenant} className="w-64" />
              ))}
          {!businessesLoading && businesses.length === 0 && (
            <p className="text-sm text-gray-400">No businesses yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

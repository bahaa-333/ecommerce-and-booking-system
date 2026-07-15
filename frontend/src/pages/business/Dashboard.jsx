import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AlertCircle, CalendarCheck, ShoppingCart, Wallet } from "lucide-react";
import { apiGet, extractErrorMessage } from "../../lib/api";
import { Skeleton, StatCardSkeleton } from "../../components/Skeleton";
import RevenueTrendChart from "../../components/RevenueTrendChart";
import StatusBreakdown from "../../components/StatusBreakdown";
import TopList from "../../components/TopList";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { tenant } = useOutletContext();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tenant) return;
    const controller = new AbortController();
    apiGet(`tenants/${tenant.slug}/analytics`, { signal: controller.signal })
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(extractErrorMessage(err));
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [tenant]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-400">Revenue and activity for {tenant?.name}.</p>

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !analytics ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard icon={Wallet} label="Paid Revenue" value={`$${Number(analytics.revenue.total_paid).toFixed(2)}`} />
            <StatCard
              icon={AlertCircle}
              label="Unpaid Revenue"
              value={`$${Number(analytics.revenue.total_unpaid).toFixed(2)}`}
            />
            <StatCard icon={ShoppingCart} label="Total Orders" value={analytics.orders.total} />
            <StatCard icon={CalendarCheck} label="Total Bookings" value={analytics.bookings.total} />
          </>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-900">Revenue (last 30 days)</h3>
        {loading || !analytics ? (
          <Skeleton className="mt-4 h-56 w-full" />
        ) : (
          <div className="mt-4">
            <RevenueTrendChart trend={analytics.revenue.trend} />
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading || !analytics ? (
          <>
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </>
        ) : (
          <>
            <StatusBreakdown title="Orders by status" byStatus={analytics.orders.by_status} total={analytics.orders.total} />
            <StatusBreakdown
              title="Bookings by status"
              byStatus={analytics.bookings.by_status}
              total={analytics.bookings.total}
            />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading || !analytics ? (
          <>
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </>
        ) : (
          <>
            <TopList
              title="Top products by revenue"
              items={analytics.top_products}
              valueKey="revenue"
              labelKey="name"
              formatValue={(v) => `$${v.toFixed(2)}`}
            />
            <TopList title="Top services by bookings" items={analytics.top_services} valueKey="booking_count" labelKey="name" />
          </>
        )}
      </div>
    </div>
  );
}
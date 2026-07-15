import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, ClipboardList, Tags, Users } from "lucide-react";
import { apiGet } from "../../lib/api";
import { StatCardSkeleton } from "../../components/Skeleton";

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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    apiGet("admin/stats", { signal: controller.signal })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-400">Platform overview across all tenants.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Building2} label="Total Tenants" value={stats.tenants_count} />
            <StatCard icon={ClipboardList} label="Pending Applications" value={stats.pending_tenants_count} />
            <StatCard icon={CheckCircle2} label="Active Tenants" value={stats.active_tenants_count} />
            <StatCard icon={Tags} label="Business Types" value={stats.business_types_count} />
            <StatCard icon={Users} label="Total Customers" value={stats.customers_count} />
          </>
        )}
      </div>

      {!loading && stats.pending_tenants_count > 0 && (
        <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          {stats.pending_tenants_count} store application{stats.pending_tenants_count === 1 ? "" : "s"} waiting for
          review —{" "}
          <Link to="/admin/applications" className="font-semibold underline">
            take a look
          </Link>
          .
        </div>
      )}
    </div>
  );
}

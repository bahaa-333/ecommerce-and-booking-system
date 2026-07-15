import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, ClipboardList, Tags } from "lucide-react";
import { apiGet } from "../../lib/api";

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
  const [tenants, setTenants] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiGet("admin/tenants", { signal: controller.signal }),
      apiGet("admin/business-types", { signal: controller.signal }),
    ])
      .then(([tenantsData, businessTypesData]) => {
        setTenants(tenantsData);
        setBusinessTypes(businessTypesData);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const pending = tenants.filter((t) => t.status === "pending").length;
  const active = tenants.filter((t) => t.status === "active").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-400">Platform overview across all tenants.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Total Tenants" value={loading ? "…" : tenants.length} />
        <StatCard icon={ClipboardList} label="Pending Applications" value={loading ? "…" : pending} />
        <StatCard icon={CheckCircle2} label="Active Tenants" value={loading ? "…" : active} />
        <StatCard icon={Tags} label="Business Types" value={loading ? "…" : businessTypes.length} />
      </div>

      {!loading && pending > 0 && (
        <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          {pending} store application{pending === 1 ? "" : "s"} waiting for review —{" "}
          <Link to="/admin/applications" className="font-semibold underline">
            take a look
          </Link>
          .
        </div>
      )}
    </div>
  );
}
import { Navigate, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useMyTenants } from "../../lib/MyTenantsContext";
import StatusBadge from "../../components/StatusBadge";

export default function SelectTenant() {
  const { tenants, loading } = useMyTenants();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Loading…</div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">No business access</h1>
          <p className="mt-2 text-sm text-gray-400">You don&apos;t own or work at any business yet.</p>
        </div>
      </div>
    );
  }

  if (tenants.length === 1) {
    return <Navigate to={`/business/${tenants[0].slug}/dashboard`} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-semibold text-gray-900">Choose a business</h1>
        <div className="mt-6 space-y-3">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              onClick={() => navigate(`/business/${tenant.slug}/dashboard`)}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4 text-left transition-colors hover:border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{tenant.name}</div>
                  <div className="text-xs capitalize text-gray-400">{tenant.role}</div>
                </div>
              </div>
              <StatusBadge status={tenant.status} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
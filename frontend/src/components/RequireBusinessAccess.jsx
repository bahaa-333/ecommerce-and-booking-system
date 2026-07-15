import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useMyTenants } from "../lib/MyTenantsContext";

export default function RequireBusinessAccess({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { tenants, loading: tenantsLoading } = useMyTenants();
  const { tenantSlug } = useParams();

  if (authLoading || tenantsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Loading…</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const tenant = tenants.find((t) => t.slug === tenantSlug);
  if (!tenant) {
    return <Navigate to="/business" replace />;
  }

  return children;
}
import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { apiGet } from "../lib/api";

export default function StoreLayout() {
  const { tenantSlug } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);
    apiGet(`tenants/${tenantSlug}`, { signal: controller.signal })
      .then((data) => {
        setTenant(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setNotFound(true);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [tenantSlug]);

  if (loading) {
    return <div className="py-24 text-center text-sm text-gray-400">Loading…</div>;
  }

  if (notFound || !tenant) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Business not found</h1>
        <p className="mt-2 text-sm text-gray-400">This business doesn&apos;t exist or isn&apos;t active.</p>
      </div>
    );
  }

  return <Outlet context={{ tenant, setTenant }} />;
}

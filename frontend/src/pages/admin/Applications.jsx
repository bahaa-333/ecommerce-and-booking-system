import { useEffect, useState } from "react";
import { apiGet, apiPatch, extractErrorMessage } from "../../lib/api";

export default function Applications() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiGet("admin/tenants", { signal: controller.signal })
      .then((data) => {
        setTenants(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const pending = tenants.filter((t) => t.status === "pending");

  async function updateStatus(tenant, status) {
    setError("");
    setBusyId(tenant.id);
    try {
      const updated = await apiPatch(`admin/tenants/${tenant.id}`, { status });
      setTenants((prev) => prev.map((t) => (t.id === tenant.id ? updated : t)));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
      <p className="mt-1 text-sm text-gray-400">Store applications awaiting review.</p>

      {error && (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-5 py-3 font-medium">Business</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Owner</th>
              <th className="px-5 py-3 font-medium">Applied</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pending.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                  No pending applications.
                </td>
              </tr>
            )}
            {pending.map((tenant) => (
              <tr key={tenant.id} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-4 font-medium text-gray-900">{tenant.name}</td>
                <td className="px-5 py-4 text-gray-500">{tenant.business_type?.name}</td>
                <td className="px-5 py-4 text-gray-500">{tenant.owner?.name ?? "—"}</td>
                <td className="px-5 py-4 text-gray-500">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={busyId === tenant.id}
                      onClick={() => updateStatus(tenant, "active")}
                      className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === tenant.id}
                      onClick={() => updateStatus(tenant, "suspended")}
                      className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
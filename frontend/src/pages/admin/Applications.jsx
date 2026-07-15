import { useState } from "react";
import { apiPatch, extractErrorMessage } from "../../lib/api";
import { usePaginatedFetch } from "../../lib/usePaginatedFetch";
import { TableSkeleton } from "../../components/Skeleton";
import Pagination from "../../components/Pagination";

export default function Applications() {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const {
    data: pending,
    setData: setPending,
    meta,
    loading,
    error: fetchError,
    setPage,
  } = usePaginatedFetch("admin/tenants", { params: { status: "pending" } });

  async function updateStatus(tenant, status) {
    setError("");
    setBusyId(tenant.id);
    try {
      await apiPatch(`admin/tenants/${tenant.id}`, { status });
      setPending((prev) => prev.filter((t) => t.id !== tenant.id));
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

      {(error || fetchError) && (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error || fetchError}</div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
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
              {loading && <TableSkeleton rows={6} columns={5} />}
              {!loading && pending.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    No pending applications.
                  </td>
                </tr>
              )}
              {!loading &&
                pending.map((tenant) => (
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
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}

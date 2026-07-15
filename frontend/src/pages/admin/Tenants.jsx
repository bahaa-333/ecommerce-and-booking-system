import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { apiPatch, extractErrorMessage } from "../../lib/api";
import { usePaginatedFetch } from "../../lib/usePaginatedFetch";
import StatusBadge from "../../components/StatusBadge";
import { TableSkeleton } from "../../components/Skeleton";
import Pagination from "../../components/Pagination";

const STATUSES = ["pending", "active", "suspended"];

export default function Tenants() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const {
    data: tenants,
    setData: setTenants,
    meta,
    loading,
    error: fetchError,
    setPage,
  } = usePaginatedFetch("admin/tenants", {
    params: {
      status: statusFilter === "all" ? undefined : statusFilter,
      search: debouncedQuery || undefined,
    },
  });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, debouncedQuery]);

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
      <h1 className="text-2xl font-semibold text-gray-900">Tenants</h1>
      <p className="mt-1 text-sm text-gray-400">Every business registered on the platform.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
          <Search className="h-4 w-4 shrink-0 text-gray-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tenants…"
            className="w-full text-sm placeholder:text-gray-300 focus:outline-none sm:w-48"
          />
        </div>
        <div className="flex flex-wrap rounded-full bg-gray-100 p-1 text-sm font-medium">
          {["all", ...STATUSES].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-4 py-1.5 capitalize transition-colors ${
                statusFilter === status ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {(error || fetchError) && (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error || fetchError}</div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Change status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={6} columns={5} />}
              {!loading && tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    No tenants match.
                  </td>
                </tr>
              )}
              {!loading &&
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-4 font-medium text-gray-900">{tenant.name}</td>
                    <td className="px-5 py-4 text-gray-500">{tenant.business_type?.name}</td>
                    <td className="px-5 py-4 text-gray-500">{tenant.owner?.name ?? "—"}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <select
                        value={tenant.status}
                        disabled={busyId === tenant.id}
                        onChange={(e) => updateStatus(tenant, e.target.value)}
                        className="rounded-full border border-gray-200 px-3 py-1.5 text-xs capitalize focus:outline-none"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
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

import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { usePaginatedFetch } from "../../lib/usePaginatedFetch";
import { apiPatch, extractErrorMessage } from "../../lib/api";
import { nextStatusOptions } from "../../lib/transactionStatus";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import { TableSkeleton } from "../../components/Skeleton";

export default function Orders() {
  const { tenant } = useOutletContext();
  const path = tenant ? `tenants/${tenant.slug}/orders` : null;
  const { data: orders, setData: setOrders, meta, loading, setPage, reload } = usePaginatedFetch(path);

  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function updateStatus(order, status) {
    setError("");
    setBusyId(order.id);
    try {
      const updated = await apiPatch(`tenants/${tenant.slug}/orders/${order.id}`, { status });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
    } catch (err) {
      setError(extractErrorMessage(err));
      reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
      <p className="mt-1 text-sm text-gray-400">Purchases placed with {tenant?.name}.</p>

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Placed</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Update status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={5} columns={6} />}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No orders yet.
                  </td>
                </tr>
              )}
              {!loading &&
                orders.map((order) => {
                  const options = nextStatusOptions(order.status);
                  return (
                    <tr key={order.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-4 font-medium text-gray-900">#{order.id}</td>
                      <td className="px-5 py-4 text-gray-500">{order.user?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-gray-500">${Number(order.total_amount).toFixed(2)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-500">
                        {new Date(order.placed_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        {options.length > 0 ? (
                          <select
                            value=""
                            disabled={busyId === order.id}
                            onChange={(e) => e.target.value && updateStatus(order, e.target.value)}
                            className="rounded-full border border-gray-200 px-3 py-1.5 text-xs capitalize focus:outline-none"
                          >
                            <option value="">Change to…</option>
                            {options.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-300">Final</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
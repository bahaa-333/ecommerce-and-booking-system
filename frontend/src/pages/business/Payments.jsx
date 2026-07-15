import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { usePaginatedFetch } from "../../lib/usePaginatedFetch";
import { apiPatch, extractErrorMessage } from "../../lib/api";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import { TableSkeleton } from "../../components/Skeleton";

const FILTERS = ["all", "paid", "unpaid"];

function payableLabel(payment) {
  if (!payment.payable) return "—";
  if (payment.payable_type.endsWith("Order")) {
    return `Order #${payment.payable.id}`;
  }
  return payment.payable.service?.name ?? `Booking #${payment.payable.id}`;
}

export default function Payments() {
  const { tenant } = useOutletContext();
  const [statusFilter, setStatusFilter] = useState("all");
  const path = tenant ? `tenants/${tenant.slug}/payments` : null;
  const params = statusFilter === "all" ? {} : { status: statusFilter };
  const { data: payments, setData: setPayments, meta, loading, setPage } = usePaginatedFetch(path, { params });

  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function toggleStatus(payment) {
    const nextStatus = payment.status === "paid" ? "unpaid" : "paid";
    setError("");
    setBusyId(payment.id);
    try {
      const updated = await apiPatch(`tenants/${tenant.slug}/payments/${payment.id}`, { status: nextStatus });
      setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, ...updated } : p)));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-400">Every payment recorded for {tenant?.name}.</p>
        </div>
        <div className="flex rounded-full bg-gray-100 p-1 text-sm font-medium">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setStatusFilter(f);
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 capitalize transition-colors ${
                statusFilter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">For</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={5} columns={6} />}
              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No payments yet.
                  </td>
                </tr>
              )}
              {!loading &&
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-4 font-medium text-gray-900">{payableLabel(payment)}</td>
                    <td className="px-5 py-4 text-gray-500">{payment.payable?.user?.name ?? "—"}</td>
                    <td className="px-5 py-4 text-gray-500">
                      {payment.currency} {Number(payment.amount).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 capitalize text-gray-500">{payment.method?.replace(/_/g, " ")}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={busyId === payment.id}
                        onClick={() => toggleStatus(payment)}
                        className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
                      >
                        Mark {payment.status === "paid" ? "unpaid" : "paid"}
                      </button>
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
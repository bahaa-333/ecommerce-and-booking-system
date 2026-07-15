import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { usePaginatedFetch } from "../../lib/usePaginatedFetch";
import { apiPatch, extractErrorMessage } from "../../lib/api";
import { nextStatusOptions } from "../../lib/transactionStatus";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import { TableSkeleton } from "../../components/Skeleton";

export default function Bookings() {
  const { tenant } = useOutletContext();
  const path = tenant ? `tenants/${tenant.slug}/bookings` : null;
  const { data: bookings, setData: setBookings, meta, loading, setPage, reload } = usePaginatedFetch(path);

  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function updateStatus(booking, status) {
    setError("");
    setBusyId(booking.id);
    try {
      const updated = await apiPatch(`tenants/${tenant.slug}/bookings/${booking.id}`, { status });
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, ...updated } : b)));
    } catch (err) {
      setError(extractErrorMessage(err));
      reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
      <p className="mt-1 text-sm text-gray-400">Appointments booked with {tenant?.name}.</p>

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Staff</th>
                <th className="px-5 py-3 font-medium">Starts</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Update status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={5} columns={6} />}
              {!loading && bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No bookings yet.
                  </td>
                </tr>
              )}
              {!loading &&
                bookings.map((booking) => {
                  const options = nextStatusOptions(booking.status);
                  return (
                    <tr key={booking.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-4 font-medium text-gray-900">{booking.service?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-gray-500">{booking.user?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-gray-500">{booking.staff?.user?.name ?? "Unassigned"}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-500">
                        {new Date(booking.starts_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        {options.length > 0 ? (
                          <select
                            value=""
                            disabled={busyId === booking.id}
                            onChange={(e) => e.target.value && updateStatus(booking, e.target.value)}
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
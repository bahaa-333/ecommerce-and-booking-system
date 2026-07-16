import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { apiGet, apiPatch, extractErrorMessage } from "../../lib/api";
import StatusBadge from "../../components/StatusBadge";
import SimpleDetailSkeleton from "../../components/customer/SimpleDetailSkeleton";

const CANCELLABLE = ["pending", "confirmed"];

export default function BookingDetail() {
  const { tenant } = useOutletContext();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiGet(`tenants/${tenant.slug}/bookings/${bookingId}`, { signal: controller.signal })
      .then((data) => {
        setBooking(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tenant.slug, bookingId]);

  async function handleCancel() {
    setError("");
    setCancelling(true);
    try {
      const updated = await apiPatch(`tenants/${tenant.slug}/bookings/${bookingId}`, { status: "cancelled" });
      setBooking(updated);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <SimpleDetailSkeleton />;
  if (!booking) return <div className="py-24 text-center text-sm text-gray-400">Booking not found.</div>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{booking.service?.name ?? "Booking"}</h1>
        <StatusBadge status={booking.status} />
      </div>
      <p className="mt-1 text-sm text-gray-400">
        {new Date(booking.starts_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
      </p>

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="mt-6 space-y-3 rounded-2xl border border-gray-100 bg-white p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Starts</span>
          <span className="text-gray-900">{new Date(booking.starts_at).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Ends</span>
          <span className="text-gray-900">{new Date(booking.ends_at).toLocaleString()}</span>
        </div>
        {booking.staff?.user && (
          <div className="flex justify-between">
            <span className="text-gray-500">Staff</span>
            <span className="text-gray-900">{booking.staff.user.name}</span>
          </div>
        )}
      </div>

      {CANCELLABLE.includes(booking.status) && (
        <button
          type="button"
          disabled={cancelling}
          onClick={handleCancel}
          className="mt-6 w-full rounded-full border border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {cancelling ? "Cancelling…" : "Cancel booking"}
        </button>
      )}
    </div>
  );
}

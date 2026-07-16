import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { apiGet, apiPost, extractErrorMessage } from "../../lib/api";
import { Skeleton } from "../../components/Skeleton";

const PAYMENT_METHODS = [
  { value: "pay_at_shop", label: "Pay at shop" },
  { value: "cash_on_delivery", label: "Cash on delivery" },
  { value: "manual_payment", label: "Manual payment" },
];

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function addDuration(date, value, unit) {
  const result = new Date(date);
  if (unit === "minutes") result.setMinutes(result.getMinutes() + value);
  if (unit === "hours") result.setHours(result.getHours() + value);
  if (unit === "days") result.setDate(result.getDate() + value);
  return result;
}

export default function BookingFlow() {
  const { tenant } = useOutletContext();
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const color = tenant.business_type?.color ?? "#f5a623";

  const [service, setService] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [time, setTime] = useState("");
  const [staffId, setStaffId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiGet(`tenants/${tenant.slug}/services/${serviceId}`, { signal: controller.signal }),
      apiGet(`tenants/${tenant.slug}/services/${serviceId}/time-slots`, { signal: controller.signal }),
    ])
      .then(([serviceData, slots]) => {
        setService(serviceData);
        setTimeSlots(slots);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tenant.slug, serviceId]);

  const minDate = useMemo(() => {
    const earliest = service?.advance_booking_value && service?.advance_booking_unit
      ? addDuration(new Date(), service.advance_booking_value, service.advance_booking_unit)
      : new Date();
    return earliest.toISOString().slice(0, 10);
  }, [service]);

  // Default the date picker to the earliest bookable day instead of leaving
  // it empty, so availability is visible immediately without the customer
  // having to guess a date first.
  useEffect(() => {
    if (minDate) setDate((prev) => prev || minDate);
  }, [minDate]);

  const availableWeekdays = useMemo(() => {
    const days = new Set(
      timeSlots
        .filter((slot) => slot.availability_type === "standing")
        .map((slot) => slot.day_of_week)
    );
    return [...days].sort().map((d) => WEEKDAY_NAMES[d]);
  }, [timeSlots]);

  const matchingSlots = useMemo(() => {
    if (!date) return [];
    const chosen = new Date(`${date}T00:00:00`);
    const dayOfWeek = chosen.getDay();

    return timeSlots.filter((slot) => {
      if (slot.availability_type === "standing") return slot.day_of_week === dayOfWeek;
      if (slot.availability_type === "date_range") {
        return chosen >= new Date(slot.starts_on) && chosen <= new Date(slot.ends_on);
      }
      return false;
    });
  }, [date, timeSlots]);

  const selectedSlot = matchingSlots.find((s) => s.id === selectedSlotId);

  useEffect(() => {
    setSelectedSlotId(matchingSlots[0]?.id ?? null);
    setTime(matchingSlots[0]?.start_time?.slice(0, 5) ?? "");
    setStaffId("");
  }, [matchingSlots]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
        <div className="mt-6 space-y-5">
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    );
  }

  if (!service) {
    return <div className="py-24 text-center text-sm text-gray-400">Service not found.</div>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!date || !time) {
      setError("Please choose a date and time.");
      return;
    }

    setSubmitting(true);
    try {
      const booking = await apiPost(`tenants/${tenant.slug}/bookings`, {
        service_id: service.id,
        service_time_slot_id: selectedSlot?.id ?? null,
        staff_id: staffId || null,
        starts_at: `${date}T${time}:00`,
        payment_method: paymentMethod,
      });
      navigate(`/store/${tenant.slug}`, { state: { bookingConfirmed: booking.id } });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900">Book {service.name}</h1>
      <p className="mt-1 text-sm text-gray-400">
        ${Number(service.price).toFixed(2)}
        {service.duration_value && service.duration_unit ? ` · ${service.duration_value} ${service.duration_unit}` : ""}
      </p>

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-900">Date</label>
          <input
            type="date"
            required
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full rounded-full border border-gray-200 px-5 py-3 text-sm focus:outline-none"
          />
        </div>

        {date && matchingSlots.length === 0 && (
          <p className="text-sm text-gray-400">
            Not available on that date.
            {availableWeekdays.length > 0 && ` Available ${availableWeekdays.join(", ")}.`}
          </p>
        )}

        {matchingSlots.length > 0 && (
          <>
            {matchingSlots.length > 1 && (
              <div>
                <label className="text-sm font-medium text-gray-900">Availability window</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {matchingSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setSelectedSlotId(slot.id);
                        setTime(slot.start_time.slice(0, 5));
                        setStaffId("");
                      }}
                      className={`rounded-full border px-4 py-1.5 text-sm ${
                        selectedSlotId === slot.id ? "border-transparent text-white" : "border-gray-200 text-gray-600"
                      }`}
                      style={selectedSlotId === slot.id ? { backgroundColor: color } : undefined}
                    >
                      {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-900">Time</label>
              <input
                type="time"
                required
                min={selectedSlot?.start_time?.slice(0, 5)}
                max={selectedSlot?.end_time?.slice(0, 5)}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-2 w-full rounded-full border border-gray-200 px-5 py-3 text-sm focus:outline-none"
              />
            </div>

            {selectedSlot?.staff?.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-900">Staff (optional)</label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="mt-2 w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm focus:outline-none"
                >
                  <option value="">No preference</option>
                  {selectedSlot.staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.user?.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <div>
          <label className="text-sm font-medium text-gray-900">Payment method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mt-2 w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm focus:outline-none"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting || !date || !time}
          className="w-full rounded-full py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: color }}
        >
          {submitting ? "Booking…" : "Confirm booking"}
        </button>
      </form>
    </div>
  );
}

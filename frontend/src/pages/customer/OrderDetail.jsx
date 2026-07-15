import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { apiGet, apiPatch, extractErrorMessage } from "../../lib/api";
import StatusBadge from "../../components/StatusBadge";

const CANCELLABLE = ["pending", "confirmed"];

export default function OrderDetail() {
  const { tenant } = useOutletContext();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiGet(`tenants/${tenant.slug}/orders/${orderId}`, { signal: controller.signal })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tenant.slug, orderId]);

  async function handleCancel() {
    setError("");
    setCancelling(true);
    try {
      const updated = await apiPatch(`tenants/${tenant.slug}/orders/${orderId}`, { status: "cancelled" });
      setOrder(updated);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <div className="py-24 text-center text-sm text-gray-400">Loading…</div>;
  if (!order) return <div className="py-24 text-center text-sm text-gray-400">Order not found.</div>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-gray-400">
        Placed {new Date(order.placed_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
      </p>

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-gray-700">
              {item.quantity}× {item.product?.name ?? "Product"}
            </span>
            <span className="font-medium text-gray-900">${Number(item.unit_price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
          <span>Total</span>
          <span>${Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {CANCELLABLE.includes(order.status) && (
        <button
          type="button"
          disabled={cancelling}
          onClick={handleCancel}
          className="mt-6 w-full rounded-full border border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {cancelling ? "Cancelling…" : "Cancel order"}
        </button>
      )}
    </div>
  );
}

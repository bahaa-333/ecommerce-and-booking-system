import { useState } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { useCart } from "../../lib/CartContext";
import { apiPost, extractErrorMessage } from "../../lib/api";

const PAYMENT_METHODS = [
  { value: "pay_at_shop", label: "Pay at shop" },
  { value: "cash_on_delivery", label: "Cash on delivery" },
  { value: "manual_payment", label: "Manual payment" },
];

export default function Checkout() {
  const { tenant } = useOutletContext();
  const color = tenant.business_type?.color ?? "#f5a623";
  const cart = useCart(tenant.slug);
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (cart.items.length === 0) {
    return <Navigate to={`/store/${tenant.slug}/cart`} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const order = await apiPost(`tenants/${tenant.slug}/orders`, {
        items: cart.items.map((item) => ({
          product_id: item.productId,
          product_variant_id: item.variantId,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
      });
      cart.clearCart();
      navigate(`/store/${tenant.slug}`, { state: { orderConfirmed: order.id } });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
      <p className="mt-1 text-sm text-gray-400">{tenant.name}</p>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {cart.items.map((item) => (
          <div key={`${item.productId}-${item.variantId}`} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-gray-700">
              {item.quantity}× {item.name}
            </span>
            <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
          <span>Total</span>
          <span>${cart.total.toFixed(2)}</span>
        </div>
      </div>

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
          disabled={submitting}
          className="w-full rounded-full py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: color }}
        >
          {submitting ? "Placing order…" : `Place order · $${cart.total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}

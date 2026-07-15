import { Link, useOutletContext } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "../../lib/CartContext";

export default function Cart() {
  const { tenant } = useOutletContext();
  const color = tenant.business_type?.color ?? "#f5a623";
  const cart = useCart(tenant.slug);

  if (cart.items.length === 0) {
    return (
      <div className="py-24 text-center">
        <ShoppingCart className="mx-auto h-10 w-10 text-gray-300" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-gray-400">Add something from {tenant.name} to get started.</p>
        <Link
          to={`/store/${tenant.slug}`}
          className="mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">Your cart</h1>
      <p className="mt-1 text-sm text-gray-400">{tenant.name}</p>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {cart.items.map((item) => (
          <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-4 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <ShoppingCart className="h-6 w-6 text-gray-300" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900">{item.name}</div>
              <div className="text-sm text-gray-400">${item.price.toFixed(2)}</div>
            </div>

            <div className="flex items-center rounded-full border border-gray-200">
              <button
                type="button"
                onClick={() => cart.updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                className="p-2 text-gray-500 hover:text-gray-800"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm">{item.quantity}</span>
              <button
                type="button"
                onClick={() => cart.updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                className="p-2 text-gray-500 hover:text-gray-800"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => cart.updateQuantity(item.productId, item.variantId, 0)}
              className="text-gray-300 hover:text-red-500"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5">
        <span className="text-sm text-gray-500">Subtotal</span>
        <span className="text-lg font-semibold text-gray-900">${cart.total.toFixed(2)}</span>
      </div>

      <Link
        to={`/store/${tenant.slug}/checkout`}
        className="mt-4 block rounded-full py-3 text-center text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: color }}
      >
        Proceed to checkout
      </Link>
    </div>
  );
}

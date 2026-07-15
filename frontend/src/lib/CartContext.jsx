import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "cart_by_tenant";

function loadCarts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const [cartsByTenant, setCartsByTenant] = useState(loadCarts);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartsByTenant));
  }, [cartsByTenant]);

  function addItem(tenantSlug, item) {
    setCartsByTenant((prev) => {
      const items = prev[tenantSlug] ?? [];
      const existing = items.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );
      const nextItems = existing
        ? items.map((i) => (i === existing ? { ...i, quantity: i.quantity + item.quantity } : i))
        : [...items, item];
      return { ...prev, [tenantSlug]: nextItems };
    });
  }

  function updateQuantity(tenantSlug, productId, variantId, quantity) {
    setCartsByTenant((prev) => {
      const items = prev[tenantSlug] ?? [];
      const nextItems =
        quantity <= 0
          ? items.filter((i) => !(i.productId === productId && i.variantId === variantId))
          : items.map((i) =>
              i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
            );
      return { ...prev, [tenantSlug]: nextItems };
    });
  }

  function clearCart(tenantSlug) {
    setCartsByTenant((prev) => ({ ...prev, [tenantSlug]: [] }));
  }

  function getCart(tenantSlug) {
    return cartsByTenant[tenantSlug] ?? [];
  }

  return (
    <CartContext.Provider value={{ cartsByTenant, addItem, updateQuantity, clearCart, getCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(tenantSlug) {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");

  const items = tenantSlug ? ctx.getCart(tenantSlug) : [];
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    total,
    count,
    addItem: (item) => ctx.addItem(tenantSlug, item),
    updateQuantity: (productId, variantId, quantity) =>
      ctx.updateQuantity(tenantSlug, productId, variantId, quantity),
    clearCart: () => ctx.clearCart(tenantSlug),
  };
}

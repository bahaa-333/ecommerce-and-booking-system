import { useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import {
  CalendarCheck,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useMyTenants } from "../lib/MyTenantsContext";

const NAV_ITEMS = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "storefront", label: "Storefront", icon: Store },
  { to: "products", label: "Products", icon: Package },
  { to: "services", label: "Services", icon: Wrench },
  { to: "orders", label: "Orders", icon: ShoppingCart },
  { to: "bookings", label: "Bookings", icon: CalendarCheck },
  { to: "payments", label: "Payments", icon: Wallet },
  { to: "team", label: "Team", icon: Users },
];

export default function BusinessLayout() {
  const { tenantSlug } = useParams();
  const { user, logout } = useAuth();
  const { tenants } = useMyTenants();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tenant = tenants.find((t) => t.slug === tenantSlug);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-6 py-6">
        <div>
          <div className="truncate text-lg font-semibold text-gray-900">{tenant?.name}</div>
          {tenants.length > 1 && (
            <button
              type="button"
              onClick={() => navigate("/business")}
              className="mt-1 flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Switch business <ChevronsUpDown className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-full p-1.5 text-gray-400 hover:bg-gray-50 md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={`/business/${tenantSlug}/${to}`}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-[#f5a623]/10 text-[#f5a623]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mx-3 mb-6 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-white md:flex">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col overflow-y-auto bg-white shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-full p-1.5 text-gray-500 hover:bg-gray-50 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-sm capitalize text-gray-400">{tenant?.role} access</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5a623] text-sm font-semibold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="hidden text-sm leading-tight sm:block">
              <div className="font-medium text-gray-900">{user?.name}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet context={{ tenant }} />
        </main>
      </div>
    </div>
  );
}
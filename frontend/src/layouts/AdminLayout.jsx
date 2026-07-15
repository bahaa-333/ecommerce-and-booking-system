import { NavLink, Outlet } from "react-router-dom";
import { Bell, Building2, ClipboardList, LayoutDashboard, LogOut, Search, Tags } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/applications", label: "Applications", icon: ClipboardList },
  { to: "/admin/tenants", label: "Tenants", icon: Building2 },
  { to: "/admin/business-types", label: "Business Types", icon: Tags },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="px-6 py-6 text-lg font-semibold text-gray-900">Aligned Tech</div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
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
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-4">
          <div className="flex w-80 items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-400">
            <Search className="h-4 w-4" />
            Search...
          </div>

          <div className="flex items-center gap-5">
            <Bell className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5a623] text-sm font-semibold text-white">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="text-sm leading-tight">
                <div className="font-medium text-gray-900">{user?.name}</div>
                <div className="text-gray-400">Admin</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
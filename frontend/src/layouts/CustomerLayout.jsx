import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { Menu, Search, ShoppingCart, Store, X } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";
import NotificationsBell from "../components/NotificationsBell";

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const cart = useCart(tenantSlug);

  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    navigate(query.trim() ? `/discover?search=${encodeURIComponent(query.trim())}` : "/discover");
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold text-gray-900">
            <Store className="h-5 w-5 text-[#f5a623]" />
            Aligned Tech
          </Link>

          <form onSubmit={handleSearch} className="hidden flex-1 items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-500 md:flex">
            <Search className="h-4 w-4 shrink-0 text-gray-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search businesses…"
              className="w-full text-sm placeholder:text-gray-300 focus:outline-none"
            />
          </form>

          <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <NavLink to="/discover" className={({ isActive }) => (isActive ? "text-[#f5a623]" : "hover:text-gray-900")}>
              Discover
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-4 md:ml-0">
            {tenantSlug && (
              <Link to={`/store/${tenantSlug}/cart`} className="relative text-gray-500 hover:text-gray-800" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                {cart.count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f5a623] px-1 text-[10px] font-semibold text-white">
                    {cart.count > 9 ? "9+" : cart.count}
                  </span>
                )}
              </Link>
            )}

            {user && <NotificationsBell />}

            {user ? (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5a623] text-sm font-semibold text-white"
                >
                  {user.name?.[0]?.toUpperCase()}
                </button>
                {accountOpen && (
                  <div
                    className="absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-gray-100 bg-white py-2 shadow-lg"
                    onMouseLeave={() => setAccountOpen(false)}
                  >
                    <Link to="/account" onClick={() => setAccountOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Account
                    </Link>
                    <Link to="/account/orders" onClick={() => setAccountOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      My Orders &amp; Bookings
                    </Link>
                    {user.portal === "business" && (
                      <Link to="/business" onClick={() => setAccountOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Manage your business
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        logout();
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-3 md:flex">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-[#f5a623] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e6981a]"
                >
                  Sign up
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="text-gray-500 hover:text-gray-800 md:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-gray-100 px-4 py-4 md:hidden">
            <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-500">
              <Search className="h-4 w-4 shrink-0 text-gray-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search businesses…"
                className="w-full text-sm placeholder:text-gray-300 focus:outline-none"
              />
            </form>

            <div className="mt-4 space-y-1 text-sm font-medium text-gray-600">
              <Link to="/discover" onClick={() => setMobileOpen(false)} className="block rounded-xl px-2 py-2 hover:bg-gray-50">
                Discover
              </Link>
              {user ? (
                <>
                  <Link to="/account" onClick={() => setMobileOpen(false)} className="block rounded-xl px-2 py-2 hover:bg-gray-50">
                    Account
                  </Link>
                  <Link to="/account/orders" onClick={() => setMobileOpen(false)} className="block rounded-xl px-2 py-2 hover:bg-gray-50">
                    My Orders &amp; Bookings
                  </Link>
                  {user.portal === "business" && (
                    <Link to="/business" onClick={() => setMobileOpen(false)} className="block rounded-xl px-2 py-2 hover:bg-gray-50">
                      Manage your business
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="block w-full rounded-xl px-2 py-2 text-left hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block rounded-xl px-2 py-2 hover:bg-gray-50">
                    Log in
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="block rounded-xl px-2 py-2 hover:bg-gray-50">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

export default function Account() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900">Account</h1>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5a623] text-lg font-semibold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{user?.name}</div>
            <div className="text-sm text-gray-400">{user?.email}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Link
          to="/account/orders"
          className="block rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm font-medium text-gray-900 hover:border-gray-200"
        >
          My Orders &amp; Bookings
        </Link>
        {user?.portal === "business" && (
          <Link
            to="/business"
            className="block rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm font-medium text-gray-900 hover:border-gray-200"
          >
            Manage your business
          </Link>
        )}
        <button
          type="button"
          onClick={logout}
          className="block w-full rounded-2xl border border-gray-100 bg-white px-5 py-4 text-left text-sm font-medium text-gray-900 hover:border-gray-200"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

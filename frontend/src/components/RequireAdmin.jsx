import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  if (!user || user.role?.slug !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
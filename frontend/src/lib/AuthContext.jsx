import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiGet, apiPost } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    return apiGet("me")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    apiGet("me", { signal: controller.signal })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setUser(null);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  async function login(email, password) {
    const data = await apiPost("login", { email, password });
    setUser(data);
    return data;
  }

  async function logout() {
    await apiPost("logout", {});
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
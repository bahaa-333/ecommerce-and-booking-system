import { createContext, useContext, useEffect, useState } from "react";
import { apiGet } from "./api";

const MyTenantsContext = createContext(null);

export function MyTenantsProvider({ children }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    apiGet("my-tenants", { signal: controller.signal })
      .then((data) => {
        setTenants(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return <MyTenantsContext.Provider value={{ tenants, loading }}>{children}</MyTenantsContext.Provider>;
}

export function useMyTenants() {
  const ctx = useContext(MyTenantsContext);
  if (!ctx) throw new Error("useMyTenants must be used within MyTenantsProvider");
  return ctx;
}
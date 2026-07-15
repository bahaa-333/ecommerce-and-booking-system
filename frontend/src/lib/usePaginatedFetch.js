import { useCallback, useEffect, useState } from "react";
import { apiGet, extractErrorMessage } from "./api";

export function usePaginatedFetch(path, { perPage = 15, params = {} } = {}) {
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!path) return;

    const controller = new AbortController();
    // page/param changes must flip back to loading immediately so the table shows a skeleton, not stale rows.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    const query = new URLSearchParams({ page, per_page: perPage, ...JSON.parse(paramsKey) }).toString();

    apiGet(`${path}?${query}`, { signal: controller.signal })
      .then((res) => {
        setData(res.data);
        setMeta(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(extractErrorMessage(err));
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [path, page, perPage, paramsKey, reloadToken]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  return { data, setData, meta, loading, error, page, setPage, reload };
}
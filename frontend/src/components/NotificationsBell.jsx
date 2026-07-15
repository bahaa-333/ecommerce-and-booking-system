import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "../lib/api";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    apiGet("notifications", { signal: controller.signal })
      .then((data) => {
        setUnreadCount(data.unread_count);
        setNotifications(data.notifications);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id) {
    try {
      await apiPatch(`notifications/${id}/read`, {});
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // best-effort, no user-facing error needed for a read receipt
    }
  }

  async function markAllRead() {
    try {
      await apiPost("notifications/read-all", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // best-effort
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-gray-500 hover:text-gray-800"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-80 max-w-[90vw] rounded-2xl border border-gray-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-medium text-gray-500 hover:text-gray-800">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && <div className="px-4 py-6 text-center text-sm text-gray-400">Loading…</div>}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet.</div>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={`block w-full border-b border-gray-50 px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50 ${
                  n.read_at ? "text-gray-400" : "text-gray-900"
                }`}
              >
                {n.data?.message ?? "Notification"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

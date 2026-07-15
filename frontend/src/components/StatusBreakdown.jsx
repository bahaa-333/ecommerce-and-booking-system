import { STATUS_COLORS } from "../lib/chartColors";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export default function StatusBreakdown({ title, byStatus, total }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <span className="text-sm text-gray-400">{total} total</span>
      </div>
      <div className="mt-4 space-y-3">
        {STATUSES.map((status) => {
          const count = byStatus[status] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={status}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="capitalize text-gray-500">{status}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
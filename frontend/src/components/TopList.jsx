import { SEQUENTIAL_BLUE } from "../lib/chartColors";

export default function TopList({ title, items, valueKey, labelKey, formatValue }) {
  const max = Math.max(1, ...items.map((i) => Number(i[valueKey])));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
        {items.map((item) => {
          const value = Number(item[valueKey]);
          const pct = (value / max) * 100;
          return (
            <div key={item.id}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-gray-600">{item[labelKey]}</span>
                <span className="shrink-0 font-medium text-gray-900">
                  {formatValue ? formatValue(value) : value}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: SEQUENTIAL_BLUE[450] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
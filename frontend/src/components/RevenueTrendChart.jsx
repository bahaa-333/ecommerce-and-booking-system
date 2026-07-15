import { useMemo, useState } from "react";
import { SEQUENTIAL_BLUE, CHART_INK } from "../lib/chartColors";

const WIDTH = 600;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 16, left: 16 };

function buildDailySeries(trend, days = 30) {
  const byDate = new Map(trend.map((t) => [t.date, Number(t.amount)]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, amount: byDate.get(key) ?? 0 });
  }
  return series;
}

export default function RevenueTrendChart({ trend }) {
  const series = useMemo(() => buildDailySeries(trend), [trend]);
  const [hoverIndex, setHoverIndex] = useState(null);

  const max = Math.max(1, ...series.map((p) => p.amount));
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const points = series.map((p, i) => {
    const x = PADDING.left + (i / (series.length - 1)) * innerWidth;
    const y = PADDING.top + innerHeight - (p.amount / max) * innerHeight;
    return { ...p, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${PADDING.top + innerHeight} L${points[0].x},${PADDING.top + innerHeight} Z`;
  const hasData = series.some((p) => p.amount > 0);
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <line
          x1={PADDING.left}
          y1={PADDING.top + innerHeight}
          x2={WIDTH - PADDING.right}
          y2={PADDING.top + innerHeight}
          stroke={CHART_INK.baseline}
          strokeWidth={1}
        />

        {hasData ? (
          <>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SEQUENTIAL_BLUE[450]} stopOpacity={0.18} />
                <stop offset="100%" stopColor={SEQUENTIAL_BLUE[450]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#revenueFill)" />
            <path
              d={linePath}
              fill="none"
              stroke={SEQUENTIAL_BLUE[450]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={4}
              fill={SEQUENTIAL_BLUE[450]}
            />
          </>
        ) : (
          <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" fontSize="13" fill={CHART_INK.muted}>
            No revenue in the last 30 days
          </text>
        )}

        {hovered && (
          <>
            <line
              x1={hovered.x}
              y1={PADDING.top}
              x2={hovered.x}
              y2={PADDING.top + innerHeight}
              stroke={CHART_INK.gridline}
              strokeWidth={1}
            />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill={SEQUENTIAL_BLUE[450]} stroke="#fff" strokeWidth={2} />
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100 - 2}%` }}
        >
          <div className="font-medium">${hovered.amount.toFixed(2)}</div>
          <div className="text-gray-300">
            {new Date(hovered.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </div>
        </div>
      )}
    </div>
  );
}
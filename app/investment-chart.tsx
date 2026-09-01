"use client";

import { useMemo, useState } from "react";
import type { InvestmentHistoryPoint } from "@/lib/plaid";

const ROTH_COLOR = "#3987e5";
const BROKERAGE_COLOR = "#199e70";
const SURFACE = "#0a0a0f";

const WIDTH = 600;
const HEIGHT = 190;
const PAD_LEFT = 46;
const PAD_RIGHT = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 20;
const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function formatDateLabel(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function buildPath(
  values: (number | null)[],
  xScale: (i: number) => number,
  yScale: (v: number) => number
): string {
  let d = "";
  let needsMove = true;
  values.forEach((v, i) => {
    if (v === null) {
      needsMove = true;
      return;
    }
    d += `${needsMove ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)} `;
    needsMove = false;
  });
  return d.trim();
}

export default function InvestmentChart({ data }: { data: InvestmentHistoryPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const values = data
      .flatMap((d) => [d.roth, d.brokerage])
      .filter((v): v is number => v !== null);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const span = max - min || Math.max(max, 1) * 0.1;
    const yMin = min - span * 0.15;
    const yMax = max + span * 0.15;

    const xScale = (i: number) =>
      data.length > 1 ? PAD_LEFT + (i / (data.length - 1)) * PLOT_WIDTH : PAD_LEFT;
    const yScale = (v: number) =>
      PAD_TOP + PLOT_HEIGHT - ((v - yMin) / (yMax - yMin || 1)) * PLOT_HEIGHT;

    const rothPath = buildPath(data.map((d) => d.roth), xScale, yScale);
    const brokeragePath = buildPath(data.map((d) => d.brokerage), xScale, yScale);

    const yTicks = [0, 0.5, 1].map((f) => {
      const value = yMin + (yMax - yMin) * f;
      return { value, y: yScale(value) };
    });

    const latestRoth = [...data].reverse().find((d) => d.roth !== null)?.roth ?? null;
    const latestBrokerage =
      [...data].reverse().find((d) => d.brokerage !== null)?.brokerage ?? null;

    return { xScale, yScale, rothPath, brokeragePath, yTicks, latestRoth, latestBrokerage };
  }, [data]);

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = Math.min(Math.max((relX - PAD_LEFT) / PLOT_WIDTH, 0), 1);
    setHoverIndex(Math.round(ratio * (data.length - 1)));
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-white/70">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: ROTH_COLOR }} />
          Roth IRA
          {chart.latestRoth !== null && (
            <span className="text-white/40">{formatMoney(chart.latestRoth)}</span>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-white/70">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: BROKERAGE_COLOR }}
          />
          Brokerage
          {chart.latestBrokerage !== null && (
            <span className="text-white/40">{formatMoney(chart.latestBrokerage)}</span>
          )}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {chart.yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={tick.y}
              y2={tick.y}
              stroke="#2c2c2a"
              strokeWidth={1}
            />
            <text x={0} y={tick.y + 3} fontSize={9} fill="#898781">
              {formatMoney(tick.value)}
            </text>
          </g>
        ))}

        {data.length > 0 && (
          <>
            <text x={PAD_LEFT} y={HEIGHT - 4} fontSize={9} fill="#898781">
              {formatDateLabel(data[0].day)}
            </text>
            <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 4} fontSize={9} fill="#898781" textAnchor="end">
              {formatDateLabel(data[data.length - 1].day)}
            </text>
          </>
        )}

        {chart.rothPath && (
          <path
            d={chart.rothPath}
            fill="none"
            stroke={ROTH_COLOR}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {chart.brokeragePath && (
          <path
            d={chart.brokeragePath}
            fill="none"
            stroke={BROKERAGE_COLOR}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {hoverIndex !== null && hovered && (
          <>
            <line
              x1={chart.xScale(hoverIndex)}
              x2={chart.xScale(hoverIndex)}
              y1={PAD_TOP}
              y2={PAD_TOP + PLOT_HEIGHT}
              stroke="#c3c2b7"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
            {hovered.roth !== null && (
              <circle
                cx={chart.xScale(hoverIndex)}
                cy={chart.yScale(hovered.roth)}
                r={4}
                fill={ROTH_COLOR}
                stroke={SURFACE}
                strokeWidth={2}
              />
            )}
            {hovered.brokerage !== null && (
              <circle
                cx={chart.xScale(hoverIndex)}
                cy={chart.yScale(hovered.brokerage)}
                r={4}
                fill={BROKERAGE_COLOR}
                stroke={SURFACE}
                strokeWidth={2}
              />
            )}
          </>
        )}
      </svg>

      <div className="text-[10px] text-white/50 h-3.5">
        {hovered && (
          <>
            {formatDateLabel(hovered.day)}
            {hovered.roth !== null && ` · Roth ${formatMoney(hovered.roth)}`}
            {hovered.brokerage !== null && ` · Brokerage ${formatMoney(hovered.brokerage)}`}
          </>
        )}
      </div>
    </div>
  );
}

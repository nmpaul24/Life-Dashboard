import {
  hasWhoopTokens,
  getWhoopRecovery,
  getWhoopSleep,
  getWhoopStrain,
} from "@/lib/whoop";
import { Card, PillLink } from "./card";

const STRAIN_MAX = 21;

function recoveryColor(score: number): string {
  if (score >= 67) return "#34d399"; // green
  if (score >= 34) return "#fbbf24"; // yellow
  return "#f87171"; // red
}

export default async function WhoopWidget() {
  const connected = await hasWhoopTokens();

  const [recovery, sleep, strain] = connected
    ? await Promise.all([getWhoopRecovery(), getWhoopSleep(), getWhoopStrain()])
    : [null, null, null];

  return (
    <Card
      title="WHOOP"
      accentColor="bg-emerald-400"
      action={
        <PillLink href="/api/auth/whoop">
          {connected ? "Reconnect" : "Connect"}
        </PillLink>
      }
    >
      {connected ? (
        <div className="flex justify-around gap-2 py-2">
          <Ring
            percent={sleep ? sleep.performancePercent : 0}
            value={sleep ? `${sleep.performancePercent}%` : "—"}
            label="Sleep"
            color="#e5e7eb"
          />
          <Ring
            percent={recovery ? recovery.recoveryScore : 0}
            value={recovery ? `${recovery.recoveryScore}%` : "—"}
            label="Recovery"
            color={recovery ? recoveryColor(recovery.recoveryScore) : "#64748b"}
          />
          <Ring
            percent={strain ? (strain.strain / STRAIN_MAX) * 100 : 0}
            value={strain ? strain.strain.toFixed(1) : "—"}
            label="Strain"
            color="#38bdf8"
          />
        </div>
      ) : (
        <p className="text-sm text-white/40">Not connected yet.</p>
      )}
    </Card>
  );
}

function Ring({
  percent,
  value,
  label,
  color,
}: {
  percent: number;
  value: string;
  label: string;
  color: string;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            stroke="rgba(255,255,255,0.1)"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg sm:text-xl font-bold text-white">
            {value}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          {label}
        </p>
        <span className="text-xs" style={{ color }}>
          ›
        </span>
      </div>
    </div>
  );
}

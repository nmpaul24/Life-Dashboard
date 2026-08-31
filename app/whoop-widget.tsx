import {
  hasWhoopTokens,
  getWhoopRecovery,
  getWhoopSleep,
  getWhoopStrain,
} from "@/lib/whoop";

const STRAIN_MAX = 21;
const RING_SIZE = 60;

function recoveryColor(score: number): string {
  if (score >= 67) return "#34d399"; // green
  if (score >= 34) return "#fbbf24"; // yellow
  return "#f87171"; // red
}

export default async function WhoopWidget() {
  const connected = await hasWhoopTokens();

  if (!connected) {
    return (
      <a
        href="/api/auth/whoop"
        className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors"
      >
        Connect WHOOP
      </a>
    );
  }

  const [recovery, sleep, strain] = await Promise.all([
    getWhoopRecovery(),
    getWhoopSleep(),
    getWhoopStrain(),
  ]);

  return (
    <div className="flex items-center gap-3">
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
      <a
        href="/api/auth/whoop"
        className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
      >
        reconnect
      </a>
    </div>
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
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
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
          <span className="text-xs font-bold text-white">{value}</span>
        </div>
      </div>
      <p
        className="text-[9px] font-semibold uppercase tracking-wide"
        style={{ color }}
      >
        {label}
      </p>
    </div>
  );
}

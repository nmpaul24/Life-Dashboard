import type { ReactNode } from "react";

export function Card({
  title,
  accentColor = "bg-white/30",
  glowRgb = "255,255,255",
  action,
  className = "",
  children,
}: {
  title: string;
  accentColor?: string;
  glowRgb?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border p-4 flex flex-col gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${className}`}
      style={{
        background: `radial-gradient(130% 110% at 0% 0%, rgba(${glowRgb},0.32) 0%, rgba(${glowRgb},0.08) 35%, rgba(255,255,255,0.02) 75%)`,
        borderColor: `rgba(${glowRgb},0.25)`,
      }}
    >
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${accentColor}`}
            style={{ boxShadow: `0 0 16px 4px rgba(${glowRgb},0.9)` }}
          />
          <h2 className="text-sm font-medium text-white/70 tracking-wide">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wide truncate">
        {label}
      </p>
      <p className="text-xl font-semibold text-white mt-1">{value}</p>
    </div>
  );
}

export function PillLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors"
    >
      {children}
    </a>
  );
}

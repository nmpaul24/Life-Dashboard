import type { ReactNode } from "react";

export function Card({
  title,
  accentColor = "bg-white/30",
  action,
  children,
}: {
  title: string;
  accentColor?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accentColor}`} />
          <h2 className="text-sm font-medium text-white/70 tracking-wide">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
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

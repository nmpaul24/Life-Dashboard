import {
  hasWhoopTokens,
  getWhoopRecovery,
  getWhoopSleep,
  getWhoopStrain,
} from "@/lib/whoop";

export default async function WhoopWidget() {
  const connected = await hasWhoopTokens();

  const [recovery, sleep, strain] = connected
    ? await Promise.all([getWhoopRecovery(), getWhoopSleep(), getWhoopStrain()])
    : [null, null, null];

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">WHOOP</h2>
      {connected && (
        <div className="flex flex-wrap gap-3">
          <Stat
            label="Recovery"
            value={recovery ? `${recovery.recoveryScore}%` : "—"}
          />
          <Stat
            label="Sleep"
            value={sleep ? `${sleep.performancePercent}%` : "—"}
          />
          <Stat
            label="Strain"
            value={strain ? strain.strain.toFixed(1) : "—"}
          />
        </div>
      )}
      <a
        href="/api/auth/whoop"
        className="inline-block bg-black text-white rounded px-4 py-2 w-fit text-sm"
      >
        {connected ? "Reconnect WHOOP" : "Connect WHOOP"}
      </a>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded px-3 py-2 w-fit">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

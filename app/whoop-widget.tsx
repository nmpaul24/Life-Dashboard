import {
  hasWhoopTokens,
  getWhoopRecovery,
  getWhoopSleep,
  getWhoopStrain,
} from "@/lib/whoop";

export default async function WhoopWidget() {
  const connected = await hasWhoopTokens();

  if (!connected) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">WHOOP</h2>
        <a
          href="/api/auth/whoop"
          className="inline-block bg-black text-white rounded px-4 py-2 w-fit text-sm"
        >
          Connect WHOOP
        </a>
      </section>
    );
  }

  const [recovery, sleep, strain] = await Promise.all([
    getWhoopRecovery(),
    getWhoopSleep(),
    getWhoopStrain(),
  ]);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">WHOOP</h2>
      <div className="flex flex-wrap gap-3">
        <Stat
          label="Recovery"
          value={recovery ? `${recovery.recoveryScore}%` : "—"}
        />
        <Stat
          label="Sleep"
          value={sleep ? `${sleep.performancePercent}%` : "—"}
        />
        <Stat label="Strain" value={strain ? strain.strain.toFixed(1) : "—"} />
      </div>
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

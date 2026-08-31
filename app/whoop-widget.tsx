import {
  hasWhoopTokens,
  getWhoopRecovery,
  getWhoopSleep,
  getWhoopStrain,
} from "@/lib/whoop";
import { Card, Stat, PillLink } from "./card";

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
        <div className="grid grid-cols-3 gap-3">
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
      ) : (
        <p className="text-sm text-white/40">Not connected yet.</p>
      )}
    </Card>
  );
}

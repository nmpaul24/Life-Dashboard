import { hasPlaidItems, getAccountBalances } from "@/lib/plaid";
import ConnectAccountButton from "./connect-account-button";
import { Card, Stat } from "./card";

export default async function PlaidWidget() {
  const connected = await hasPlaidItems();
  const balances = connected ? await getAccountBalances() : null;

  return (
    <Card
      title="Investments"
      accentColor="bg-amber-400"
      glowRgb="251,191,36"
      className="h-full"
      action={<ConnectAccountButton />}
    >
      {connected && (!balances || balances.length === 0) && (
        <p className="text-sm text-white/40">
          Could not load account balances.
        </p>
      )}

      {!connected && (
        <p className="text-sm text-white/40">Not connected yet.</p>
      )}

      {balances && balances.length > 0 && (
        <>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wide">
              Net Worth
            </p>
            <p className="text-3xl font-bold text-white mt-1 drop-shadow-[0_0_22px_rgba(251,191,36,0.65)]">
              $
              {balances
                .reduce((sum, a) => sum + (a.currentBalance ?? 0), 0)
                .toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {balances.map((account, i) => (
              <Stat
                key={`${account.institutionName ?? "account"}-${i}`}
                label={
                  account.institutionName
                    ? `${account.institutionName} — ${account.accountName}`
                    : account.accountName
                }
                value={
                  account.currentBalance !== null
                    ? `$${account.currentBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "—"
                }
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

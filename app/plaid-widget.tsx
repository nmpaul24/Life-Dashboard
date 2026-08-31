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
      )}
    </Card>
  );
}

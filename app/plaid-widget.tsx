import { hasPlaidItems, getAccountBalances } from "@/lib/plaid";
import ConnectAccountButton from "./connect-account-button";

export default async function PlaidWidget() {
  const connected = await hasPlaidItems();
  const balances = connected ? await getAccountBalances() : null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Investments</h2>

      {connected && (!balances || balances.length === 0) && (
        <p className="text-sm text-gray-400">
          Could not load account balances.
        </p>
      )}

      {balances && balances.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {balances.map((account, i) => (
            <div
              key={`${account.institutionName ?? "account"}-${i}`}
              className="border rounded px-3 py-2 w-fit"
            >
              <p className="text-sm text-gray-500">
                {account.institutionName ? `${account.institutionName} — ` : ""}
                {account.accountName}
              </p>
              <p className="font-medium">
                {account.currentBalance !== null
                  ? `$${account.currentBalance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      <ConnectAccountButton />
    </section>
  );
}

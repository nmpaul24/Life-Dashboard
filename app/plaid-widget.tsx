import { hasPlaidItem, getAccountBalances } from "@/lib/plaid";
import ConnectFidelityButton from "./connect-fidelity-button";

export default async function PlaidWidget() {
  const connected = await hasPlaidItem();

  if (!connected) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Fidelity</h2>
        <ConnectFidelityButton />
      </section>
    );
  }

  const balances = await getAccountBalances();

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Fidelity</h2>
      {!balances || balances.length === 0 ? (
        <p className="text-sm text-gray-400">
          Could not load account balances.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {balances.map((account) => (
            <div
              key={account.name}
              className="border rounded px-3 py-2 w-fit"
            >
              <p className="text-sm text-gray-500">{account.name}</p>
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
    </section>
  );
}

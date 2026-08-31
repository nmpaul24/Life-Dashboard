import { hasWhoopTokens } from "@/lib/whoop";

export default async function WhoopWidget() {
  const connected = await hasWhoopTokens();

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">WHOOP</h2>
      {connected ? (
        <p className="text-sm text-gray-500">
          Connected. (Recovery/sleep/strain display coming next.)
        </p>
      ) : (
        <a
          href="/api/auth/whoop"
          className="inline-block bg-black text-white rounded px-4 py-2 w-fit text-sm"
        >
          Connect WHOOP
        </a>
      )}
    </section>
  );
}

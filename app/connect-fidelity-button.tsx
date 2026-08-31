"use client";

import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string;
        onSuccess: (publicToken: string) => void;
        onExit?: () => void;
      }) => { open: () => void };
    };
  }
}

export default function ConnectFidelityButton() {
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  async function handleClick() {
    setLoading(true);

    try {
      const res = await fetch("/api/plaid/link-token");
      const data = await res.json();
      const linkToken: string | undefined = data.link_token;

      if (!linkToken || !window.Plaid) {
        setLoading(false);
        return;
      }

      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken) => {
          await fetch("/api/plaid/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_token: publicToken }),
          });
          window.location.reload();
        },
        onExit: () => setLoading(false),
      });
      handler.open();
    } catch {
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        onLoad={() => setScriptReady(true)}
      />
      <button
        onClick={handleClick}
        disabled={loading || !scriptReady}
        className="inline-block bg-black text-white rounded px-4 py-2 w-fit text-sm disabled:opacity-50"
      >
        {loading ? "Connecting..." : "Connect Fidelity"}
      </button>
    </>
  );
}

"use client";

import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string;
        onSuccess: (
          publicToken: string,
          metadata: { institution?: { name: string } | null }
        ) => void;
        onExit?: () => void;
      }) => { open: () => void };
    };
  }
}

export default function ConnectAccountButton() {
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
        onSuccess: async (publicToken, metadata) => {
          await fetch("/api/plaid/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              public_token: publicToken,
              institution_name: metadata.institution?.name ?? null,
            }),
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
        className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors disabled:opacity-40"
      >
        {loading ? "Connecting..." : "Connect an account"}
      </button>
    </>
  );
}

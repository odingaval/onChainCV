"use client";
import { useEffect, useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { fetchCredentialsForSubject, CredentialSummary } from "@/lib/events";

export default function MyCredentialsPage() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const [items, setItems] = useState<CredentialSummary[]>([]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!address) return;
      try {
        setStatus("Loading...");
        const res = await fetchCredentialsForSubject(config, address);
        setItems(res);
        setStatus("");
      } catch (e: any) {
        setStatus(e?.shortMessage || e?.message || "Failed to load");
      }
    })();
  }, [address]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">My Credentials</h1>
      <p className="text-sm text-zinc-600 mt-1">Connected: {isConnected ? address : "Not connected"}</p>
      {status && <p className="mt-3 text-sm">{status}</p>}

      <div className="mt-6 grid gap-4">
        {items.map((c) => (
          <div key={c.tokenId.toString()} className="rounded border p-4">
            <div className="text-sm text-zinc-600">Token #{c.tokenId.toString()}</div>
            <div className="font-medium">CID: {c.cid}</div>
            <div className="text-sm">Issuer: {c.issuer}</div>
            <div className="text-sm">Revoked: {c.revoked ? "Yes" : "No"}</div>
            <a className="text-blue-600 underline text-sm" href={c.gatewayUrl} target="_blank">Open metadata</a>
          </div>
        ))}
        {!items.length && !status && (
          <p className="text-sm text-zinc-600">No credentials found in recent blocks.</p>
        )}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useToast } from "../providers";

type ApiCredential = {
  tokenId: string;
  issuer: string;
  subject: string;
  cid: string;
  uri: string;
  gatewayUrl: string;
  issuedAtBlock: string;
  revoked: boolean;
  revokedAtBlock?: string;
};

export default function MyCredentialsPage() {
  const { address, isConnected } = useAccount();
  const { addToast } = useToast();
  const [items, setItems] = useState<ApiCredential[]>([]);
  const [status, setStatus] = useState<string>("");
  const [windowBlocks, setWindowBlocks] = useState<number>(3000);

 useEffect(() => {
  (async () => {
    if (!address) return;
    try {
      setStatus("Loading...");
      const res = await fetch(`/api/credentials?address=${address}&window=${windowBlocks}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = (await res.json()) as ApiCredential[];
      setItems(data);
      setStatus("");
    } catch (e: any) {
      const msg = e?.message || "Failed to load";
      setStatus(msg);
      addToast({ type: "error", message: msg });
    }
  })();
}, [address, windowBlocks]);

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    addToast({ type: "success", message: `${label} copied` });
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold">My Credentials</h1>
      <p className="text-sm text-zinc-600 mt-1">Connected: {isConnected ? address : "Not connected"}</p>
      {status && <p className="mt-3 text-sm">{status}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((c) => (
          <div key={c.tokenId.toString()} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-300">Token #{c.tokenId.toString()}</div>
              <span className={`text-xs rounded px-2 py-0.5 ${c.revoked ? "bg-red-600/20 text-red-300 border border-red-600/30" : "bg-green-600/20 text-green-300 border border-green-600/30"}`}>
                {c.revoked ? "Revoked" : "Active"}
              </span>
            </div>
            <div className="mt-2 text-sm">
              <div className="break-all"><span className="text-zinc-400">Issuer:</span> {c.issuer}</div>
              <div className="break-all"><span className="text-zinc-400">CID:</span> {c.cid}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button onClick={() => copy(c.tokenId.toString(), "Token ID")} className="rounded border border-white/20 px-2 py-1 hover:bg-white/10">Copy Token ID</button>
              <button onClick={() => copy(c.cid, "CID")} className="rounded border border-white/20 px-2 py-1 hover:bg-white/10">Copy CID</button>
              <a className="rounded border border-white/20 px-2 py-1 hover:bg-white/10" href={c.gatewayUrl} target="_blank">Open metadata</a>
            </div>
          </div>
        ))}
        {!items.length && !status && (
          <div className="text-sm text-zinc-400">
            <p>No credentials found in the last {windowBlocks.toLocaleString()} blocks.</p>
            <button
              onClick={() => setWindowBlocks((w) => Math.min(w + 5000, 20000))}
              className="mt-3 rounded border border-white/20 px-3 py-1.5 hover:bg-white/10"
            >
              Load older history (+5k)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

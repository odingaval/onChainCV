"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useToast } from "../providers";
import ProfileManager from "../../components/ProfileManager";

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
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && address) {
      setShareUrl(`${window.location.origin}/view/${address}`);
    }
  }, [address]);

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
      }
    })();
  }, [address, windowBlocks]);

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    // addToast({ type: "success", message: `${label} copied` });
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">My Profile</h2>
        <p className="text-gray-600">Please connect your wallet to manage your profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold">My Profile & Credentials</h1>
      <p className="text-sm text-zinc-600 mt-1">Connected: {isConnected ? address : "Not connected"}</p>
      {status && <p className="mt-3 text-sm">{status}</p>}
      
      {/* Profile Management Section */}
      <div className="mt-6">
        <ProfileManager />
      </div>
      
      {/* Profile Sharing Section */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">Share Your Profile</h2>
        <p className="text-gray-300 mb-4">
          Share your public profile with others. They can view your credentials and profile information based on your privacy settings.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Profile URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
                placeholder="Profile URL will appear here"
                style={{ 
                  color: 'white', 
                  WebkitTextFillColor: 'white',
                  opacity: 1
                }}
              />
              <button
                onClick={async () => {
                  const url = shareUrl;
                  if (url) {
                    try {
                      await navigator.clipboard.writeText(url);
                      addToast({ type: "success", message: "Profile URL copied!" });
                    } catch (err) {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = url;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      addToast({ type: "success", message: "Profile URL copied!" });
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Copy
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Anyone with this link can view your public profile. Make sure your profile is set to public in the settings above.
          </p>
        </div>
      </div>
    
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
  
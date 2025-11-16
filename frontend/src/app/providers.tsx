"use client";
import { WagmiProvider, useAccount, useChainId, useConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { readContract } from "wagmi/actions";
import { addresses, issuerRegistryAbi, isValidAddress } from "@/contracts";
import { config } from "../wagmi";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Minimal toast system
const ToastContext = createContext<{ addToast: (t: { type?: "success" | "error" | "info"; message: string; link?: { href: string; label?: string } }) => void } | null>(null);
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within Providers");
  return ctx;
}

function short(addr?: string | null) {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function StatusBar() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wagmiConfig = useConfig();
  const [owner, setOwner] = useState<string>("");
  const [isIssuer, setIsIssuer] = useState<boolean>(false);

  async function refresh() {
    try {
      if (isValidAddress(addresses.registry)) {
        const o = await readContract(wagmiConfig, {
          address: addresses.registry,
          abi: issuerRegistryAbi,
          functionName: "owner",
          args: [],
        });
        setOwner(String(o));
      } else {
        setOwner("");
      }
      if (isConnected && isValidAddress(addresses.registry) && address) {
        const ok = await readContract(wagmiConfig, {
          address: addresses.registry,
          abi: issuerRegistryAbi,
          functionName: "isIssuer",
          args: [address],
        });
        setIsIssuer(Boolean(ok));
      } else {
        setIsIssuer(false);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId, addresses.registry]);

  const role = useMemo(() => {
    if (!isConnected) return "Disconnected";
    if (owner && owner.toLowerCase() === address?.toLowerCase()) return "Owner";
    if (isIssuer) return "Issuer";
    return "Viewer";
  }, [isConnected, owner, address, isIssuer]);

  return (
    <div className="w-full border-b bg-zinc-50 text-xs text-zinc-700 px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span>Account: {isConnected ? short(address) : "Not connected"}</span>
        <span>Chain: {chainId ?? "-"}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded bg-zinc-200 px-2 py-0.5">{role}</span>
        <button onClick={refresh} className="rounded border px-2 py-0.5">Refresh</button>
      </div>
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [toasts, setToasts] = useState<{ id: string; type?: "success" | "error" | "info"; message: string; link?: { href: string; label?: string } }[]>([]);

  const addToast = useCallback((t: { type?: "success" | "error" | "info"; message: string; link?: { href: string; label?: string } }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 6000);
  }, []);

  const toastCtx = useMemo(() => ({ addToast }), [addToast]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ToastContext.Provider value={toastCtx}>
          <StatusBar />
          {children}
          <div className="fixed right-3 top-3 z-50 flex w-[360px] max-w-[90vw] flex-col gap-2">
            {toasts.map((t) => (
              <div key={t.id} className={`rounded border p-3 text-sm shadow bg-white ${t.type === "success" ? "border-green-300" : t.type === "error" ? "border-red-300" : "border-zinc-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="whitespace-pre-wrap break-words">{t.message}</div>
                  {t.link && (
                    <a className="text-blue-600 underline shrink-0" href={t.link.href} target="_blank" rel="noreferrer">{t.link.label ?? "Open"}</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ToastContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

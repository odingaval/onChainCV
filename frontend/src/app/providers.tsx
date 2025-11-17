"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "../wagmi";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

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
          {children}
          <div className="fixed right-3 top-3 z-50 flex w-[360px] max-w-[90vw] flex-col gap-2">
            {toasts.map((t) => (
              <div key={t.id} className={`rounded border p-3 text-sm shadow bg-gray-900 text-white ${t.type === "success" ? "border-green-500" : t.type === "error" ? "border-red-500" : "border-gray-600"}`}>
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

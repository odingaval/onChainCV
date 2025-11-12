"use client";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { readContract } from "wagmi/actions";
import { useConfig } from "wagmi";
import { addresses, credentialSbtAbi, isValidAddress } from "../contracts";

export default function Home() {
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const wagmiConfig = useConfig();
  const [tokenId, setTokenId] = useState<string>("1");
  const [uri, setUri] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function onConnect() {
    await connectAsync({ connector: injected() });
  }

  async function fetchTokenURI() {
    setLoading(true);
    try {
      if (!isValidAddress(addresses.sbt)) throw new Error("SBT address not set");
      const result = await readContract(wagmiConfig, {
        address: addresses.sbt,
        abi: credentialSbtAbi,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
      });
      setUri(String(result));
    } catch (e) {
      const msg = (e as any)?.shortMessage || (e as any)?.message || "Error fetching tokenURI";
      setUri(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">OnchainCV</h1>
          {isConnected ? (
            <button onClick={() => disconnect()} className="rounded bg-zinc-800 px-3 py-2 text-white dark:bg-zinc-200 dark:text-black">
              Disconnect {address?.slice(0,6)}...{address?.slice(-4)}
            </button>
          ) : (
            <button onClick={onConnect} className="rounded bg-zinc-800 px-3 py-2 text-white dark:bg-zinc-200 dark:text-black">
              Connect Wallet
            </button>
          )}
        </div>

        <div className="mt-4">
          <div className="flex gap-4 text-sm">
            <a href="/issue" className="text-blue-600 underline">Issue Credential</a>
            <a href="/view" className="text-blue-600 underline">View Credential</a>
            <a href="/my" className="text-blue-600 underline">My Credentials</a>
            <a href="/admin" className="text-blue-600 underline">Admin</a>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Token ID</label>
          <input value={tokenId} onChange={(e) => setTokenId(e.target.value)} className="w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800" />
          <button onClick={fetchTokenURI} disabled={loading || !addresses.sbt} className="mt-3 rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50">
            {loading ? "Loading..." : "Read tokenURI"}
          </button>
          {uri && (
            <div className="mt-3 break-all text-sm text-zinc-800 dark:text-zinc-200">{uri}</div>
          )}
        </div>
        {!isValidAddress(addresses.sbt) && (
          <p className="mt-4 text-sm text-amber-600">Set NEXT_PUBLIC_SBT_ADDRESS and NEXT_PUBLIC_REGISTRY_ADDRESS in .env.local.</p>
        )}
      </main>
    </div>
  );
}

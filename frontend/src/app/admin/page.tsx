"use client";
import { useEffect, useState } from "react";
import { useAccount, useConfig, useChainId } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { addresses, issuerRegistryAbi, isValidAddress } from "../../contracts";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const chainId = useChainId();

  const [owner, setOwner] = useState<string>("");
  const [ownerLoading, setOwnerLoading] = useState<boolean>(false);
  const [ownerLoaded, setOwnerLoaded] = useState<boolean>(false);
  const [issuerAddr, setIssuerAddr] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loadingTx, setLoadingTx] = useState<boolean>(false);

  async function refreshOwner() {
    setOwnerLoading(true);
    try {
      if (!isValidAddress(addresses.registry)) throw new Error("Registry address not set");
      const o = await readContract(config, {
        address: addresses.registry,
        abi: issuerRegistryAbi,
        functionName: "owner",
        args: [],
      });
      setOwner(String(o));
    } catch (e: any) {
      setOwner("");
    } finally {
      setOwnerLoaded(true);
      setOwnerLoading(false);
    }
  }

  useEffect(() => {
    refreshOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.registry, address, chainId]);

  const hasOwner = isValidAddress(owner);
  const isOwner = isConnected && hasOwner && owner.toLowerCase() === address?.toLowerCase();

  async function addIssuer() {
    try {
      setLoadingTx(true);
      setStatus("Adding issuer...");
      if (!isValidAddress(addresses.registry)) throw new Error("Registry address not set");
      if (!isValidAddress(issuerAddr)) throw new Error("Invalid issuer address");
      if (!chainId) throw new Error("Wallet not connected to a chain");
      const hash = await writeContract(config, {
        address: addresses.registry,
        abi: issuerRegistryAbi,
        functionName: "addIssuer",
        args: [issuerAddr as `0x${string}`],
      });
      setStatus(`Submitted: ${hash}`);
      const receipt = await Promise.race([
        waitForTransactionReceipt(config, { hash }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout waiting for confirmation")), 45000)),
      ]).catch((e) => e as any);
      if (receipt && receipt.transactionHash) {
        setStatus(`Issuer added in tx ${receipt.transactionHash}`);
      } else {
        try {
          const ok = await readContract(config, {
            address: addresses.registry,
            abi: issuerRegistryAbi,
            functionName: "isIssuer",
            args: [issuerAddr as `0x${string}`],
          });
          if (ok) setStatus("Issuer added (verified)");
        } catch {}
      }
      await refreshOwner();
    } catch (e: any) {
      setStatus(e?.shortMessage || e?.message || "Add issuer failed");
    }
    finally {
      setLoadingTx(false);
    }
  }

  async function removeIssuer() {
    try {
      setLoadingTx(true);
      setStatus("Removing issuer...");
      if (!isValidAddress(addresses.registry)) throw new Error("Registry address not set");
      if (!isValidAddress(issuerAddr)) throw new Error("Invalid issuer address");
      const hash = await writeContract(config, {
        address: addresses.registry,
        abi: issuerRegistryAbi,
        functionName: "removeIssuer",
        args: [issuerAddr as `0x${string}`],
      });
      setStatus(`Submitted: ${hash}`);
      const receipt = await Promise.race([
        waitForTransactionReceipt(config, { hash }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout waiting for confirmation")), 45000)),
      ]).catch((e) => e as any);
      if (receipt && receipt.transactionHash) {
        setStatus(`Issuer removed in tx ${receipt.transactionHash}`);
      } else {
        try {
          const ok = await readContract(config, {
            address: addresses.registry,
            abi: issuerRegistryAbi,
            functionName: "isIssuer",
            args: [issuerAddr as `0x${string}`],
          });
          if (!ok) setStatus("Issuer removed (verified)");
        } catch {}
      }
      await refreshOwner();
    } catch (e: any) {
      setStatus(e?.shortMessage || e?.message || "Remove issuer failed");
    }
    finally {
      setLoadingTx(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Admin</h1>
      <p className="mt-2 text-sm text-zinc-600">Connected: {isConnected ? address : "Not connected"}</p>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span>Registry owner: {ownerLoading ? "Loading..." : (owner || "-")}</span>
        <button onClick={refreshOwner} className="rounded border px-2 py-1 text-xs">Refresh</button>
      </div>
      {ownerLoaded && !hasOwner && (
        <p className="text-xs text-amber-600 mt-1">Owner not loaded. Check network and address, then click Refresh.</p>
      )}
      {ownerLoaded && hasOwner && isConnected && !isOwner && (
        <p className="text-xs text-amber-600 mt-1">You are not the owner. Owner-only actions will fail.</p>
      )}

      <div className="mt-6 space-y-3">
        <div>
          <label className="block text-sm mb-1">Issuer Address</label>
          <input value={issuerAddr} onChange={(e) => setIssuerAddr(e.target.value)} placeholder="0x..." className="w-full rounded border p-2" />
        </div>
        <div className="flex gap-3">
          <button onClick={addIssuer} disabled={loadingTx} className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50">{loadingTx ? "Working..." : "Add Issuer"}</button>
          <button onClick={removeIssuer} disabled={loadingTx} className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-50">{loadingTx ? "Working..." : "Remove Issuer"}</button>
        </div>
        {status && <p className="text-sm mt-2 break-all">{status}</p>}
        {!isValidAddress(addresses.registry) && (
          <p className="text-xs text-amber-600">Set NEXT_PUBLIC_REGISTRY_ADDRESS in .env.local.</p>
        )}
      </div>
    </div>
  );
}

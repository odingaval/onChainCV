"use client";
import { useState } from "react";
import { useConfig, useAccount } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { addresses, credentialSbtAbi, isValidAddress } from "../../contracts";
import { toGatewayUrl } from "../../lib/ipfs";
import { useToast } from "../providers";

export default function ViewCredentialPage() {
  const config = useConfig();
  const { address } = useAccount();
  const { addToast } = useToast();

  const [tokenId, setTokenId] = useState<string>("1");
  const [status, setStatus] = useState<string>("");
  const [data, setData] = useState<any | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);

  async function fetchCredential() {
    try {
      setStatus("Fetching credential...");
      setData(null);
      setMetadata(null);
      if (!isValidAddress(addresses.sbt)) throw new Error("SBT address not set");

      const token = BigInt(tokenId);
      const [cred, uri] = await Promise.all([
        readContract(config, {
          address: addresses.sbt,
          abi: credentialSbtAbi,
          functionName: "credential",
          args: [token],
        }),
        readContract(config, {
          address: addresses.sbt,
          abi: credentialSbtAbi,
          functionName: "tokenURI",
          args: [token],
        }),
      ]);

      setData({ ...cred, uri: String(uri) });

      // Try fetching metadata JSON via gateway
      const gatewayUrl = toGatewayUrl(String(uri));
      try {
        const res = await fetch(gatewayUrl);
        if (res.ok) {
          const json = await res.json();
          setMetadata(json);
          setStatus("");
          addToast({ type: "success", message: "Credential loaded" });
        } else {
          setStatus(`Fetched credential. Metadata fetch failed: ${res.status}`);
          addToast({ type: "error", message: `Metadata fetch failed: ${res.status}` });
        }
      } catch (e) {
        setStatus("Fetched credential. Metadata fetch failed.");
        addToast({ type: "error", message: "Metadata fetch failed" });
      }
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || "Fetch failed";
      setStatus(msg);
      addToast({ type: "error", message: msg });
    }
  }

  async function revoke() {
    const explorer = (h: string) => `https://moonbase.moonscan.io/tx/${h}`;
    try {
      setStatus("Revoking credential...");
      if (!isValidAddress(addresses.sbt)) throw new Error("SBT address not set");
      const token = BigInt(tokenId);
      const hash = await writeContract(config, {
        address: addresses.sbt,
        abi: credentialSbtAbi,
        functionName: "revoke",
        args: [token],
      });
      addToast({ type: "info", message: "Revoke submitted", link: { href: explorer(hash), label: "View tx" } });
      await waitForTransactionReceipt(config, { hash });
      setStatus("Revoked. Refreshing...");
      addToast({ type: "success", message: "Credential revoked", link: { href: explorer(hash), label: "View tx" } });
      await fetchCredential();
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || "Revoke failed";
      setStatus(msg);
      addToast({ type: "error", message: msg });
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">View Credential</h1>
      <div className="mt-4">
        <label className="block text-sm mb-1">Token ID</label>
        <input value={tokenId} onChange={(e) => setTokenId(e.target.value)} className="w-full rounded border p-2" />
        <button onClick={fetchCredential} className="mt-3 rounded bg-zinc-800 px-3 py-2 text-white">Fetch</button>
      </div>

      {data && (
        <div className="mt-6 space-y-1 text-sm">
          <p><span className="font-medium">Issuer:</span> {data.issuer}</p>
          <p><span className="font-medium">Subject:</span> {data.subject}</p>
          <p><span className="font-medium">Issued At:</span> {new Date(Number(data.issuedAt) * 1000).toLocaleString()}</p>
          <p><span className="font-medium">Revoked:</span> {data.revoked ? "Yes" : "No"}</p>
          <p><span className="font-medium">TokenURI:</span> {data.uri}</p>
          <p><span className="font-medium">Gateway:</span> <a className="text-blue-600 underline" href={toGatewayUrl(data.uri)} target="_blank">{toGatewayUrl(data.uri)}</a></p>
          <div className="mt-3">
            <button onClick={revoke} className="rounded bg-red-600 px-3 py-2 text-white">Revoke (issuer only)</button>
          </div>
        </div>
      )}

      {metadata && (
        <div className="mt-6">
          <h2 className="font-medium">Metadata</h2>
          <pre className="mt-2 whitespace-pre-wrap break-all rounded bg-zinc-100 p-3 text-xs">{JSON.stringify(metadata, null, 2)}</pre>
        </div>
      )}

      {status && <p className="mt-4 text-sm">{status}</p>}

      {!isValidAddress(addresses.sbt) && (
        <p className="mt-4 text-xs text-amber-600">Set NEXT_PUBLIC_SBT_ADDRESS in .env.local.</p>
      )}
    </div>
  );
}

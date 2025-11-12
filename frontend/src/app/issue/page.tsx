"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useConfig } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { addresses, credentialSbtAbi, issuerRegistryAbi, isValidAddress } from "../../contracts";
import { uploadJsonToIpfs, toGatewayUrl } from "../../lib/ipfs";

export default function IssuePage() {
  const { address, isConnected } = useAccount();
  const config = useConfig();

  const [recipient, setRecipient] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [cid, setCid] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [isIssuer, setIsIssuer] = useState<boolean | null>(null);

  async function checkIssuer() {
    if (!address) return;
    try {
      if (!isValidAddress(addresses.registry)) throw new Error("Registry address not set");
      const ok = await readContract(config, {
        address: addresses.registry,
        abi: issuerRegistryAbi,
        functionName: "isIssuer",
        args: [address],
      });
      setIsIssuer(Boolean(ok));
    } catch {
      setIsIssuer(false);
    }
  }

  async function handleUpload() {
    setStatus("Uploading to IPFS...");
    try {
      const metadata = {
        title,
        description,
        issuer: address,
        issuedAt: Date.now(),
      };
      const uploadedCid = await uploadJsonToIpfs(metadata);
      setCid(uploadedCid);
      setStatus(`Uploaded: ${toGatewayUrl(uploadedCid)}`);
    } catch (e) {
      setStatus("IPFS upload failed. Ensure NEXT_PUBLIC_IPFS_API is reachable.");
    }
  }

  async function handleMint() {
    try {
      setStatus("Minting...");
      if (!isValidAddress(addresses.sbt)) throw new Error("SBT address not set");
      if (!isValidAddress(recipient)) throw new Error("Recipient address invalid");
      const hash = await writeContract(config, {
        address: addresses.sbt,
        abi: credentialSbtAbi,
        functionName: "mint",
        args: [recipient as `0x${string}`, cid],
      });
      const receipt = await waitForTransactionReceipt(config, { hash });
      setStatus(`Minted in tx ${receipt.transactionHash}`);
    } catch (e: any) {
      setStatus(e?.shortMessage || e?.message || "Mint failed");
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Issue Credential</h1>
      <p className="mt-2 text-sm text-zinc-600">Connected: {isConnected ? address : "Not connected"}</p>
      <button onClick={checkIssuer} className="mt-3 rounded bg-zinc-800 px-3 py-2 text-white">Check issuer status</button>
      {isIssuer !== null && (
        <p className="mt-2 text-sm">Issuer status: {isIssuer ? "Authorized" : "Not authorized"}</p>
      )}

      <div className="mt-6 space-y-3">
        <div>
          <label className="block text-sm mb-1">Recipient address</label>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x..." className="w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">CID (optional if uploading)</label>
          <input value={cid} onChange={(e) => setCid(e.target.value)} placeholder="bafy..." className="w-full rounded border p-2" />
        </div>
        <div className="flex gap-3">
          <button onClick={handleUpload} className="rounded bg-blue-600 px-3 py-2 text-white">Upload JSON → IPFS</button>
          <button onClick={handleMint} disabled={!cid || !recipient || isIssuer === false} className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50">Mint</button>
        </div>
        {status && <p className="text-sm mt-2 break-all">{status}</p>}
        {!process.env.NEXT_PUBLIC_IPFS_API && (
          <p className="text-xs text-amber-600">Set NEXT_PUBLIC_IPFS_API for uploads (e.g., http://localhost:5001/api/v0). Or paste a CID manually.</p>
        )}
        {!isValidAddress(addresses.sbt) && (
          <p className="text-xs text-amber-600">Set NEXT_PUBLIC_SBT_ADDRESS and NEXT_PUBLIC_REGISTRY_ADDRESS in .env.local.</p>
        )}
      </div>
    </div>
  );
}



import { NextResponse } from "next/server";
import { Address, Log, Hex, createPublicClient, decodeEventLog, getAbiItem, http, defineChain } from "viem";
import { credentialSbtAbi, addresses, isValidAddress } from "@/contracts";
import { toGatewayUrl } from "@/lib/ipfs";

export const runtime = "nodejs";
const isDev = process.env.NODE_ENV !== "production";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("address") as Address | null;
    if (!subject) return NextResponse.json({ error: "Missing address" }, { status: 400 });
    const windowParam = searchParams.get("window");
    const parsedWindow = windowParam ? BigInt(Math.max(0, Number(windowParam))) : undefined;

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
    const chainIdStr = process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || "1287"; // Moonbase default
    if (!rpcUrl) return NextResponse.json({ error: "RPC URL not configured (NEXT_PUBLIC_RPC_URL)" }, { status: 500 });

    if (!isValidAddress(addresses.sbt)) return NextResponse.json({ error: "SBT address not set (NEXT_PUBLIC_SBT_ADDRESS)" }, { status: 500 });

    const chain = defineChain({
      id: Number(chainIdStr),
      name: "Custom",
      nativeCurrency: { name: "Unit", symbol: "UNIT", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    });

    const client = createPublicClient({ transport: http(rpcUrl), chain });

    const contract = addresses.sbt as Address;
    let latest: bigint;
    try {
      latest = await client.getBlockNumber();
    } catch (e: any) {
      if (isDev) console.error("/api/credentials getBlockNumber failed:", e);
      return NextResponse.json({ error: "RPC getBlockNumber failed", details: isDev ? (e?.message || String(e)) : undefined }, { status: 502 });
    }
    const window = parsedWindow || 100_000n; // wider default window to include older credentials
    const from = latest > window ? latest - window : 0n;
    const to = latest;
    if (isDev) console.log("/api/credentials params", { contract, subject, from: from.toString(), to: to.toString(), rpcUrl: rpcUrl?.slice(0, 32) + "…" });

    const issuedEventAbi = getAbiItem({ abi: credentialSbtAbi as any, name: "CredentialIssued" });
    const revokedEventAbi = getAbiItem({ abi: credentialSbtAbi as any, name: "CredentialRevoked" });

    // Helper: chunked getLogs with retry + small delay to play nice with free-tier RPCs
    async function getLogsChunked(client: any, params: { address: Address; fromBlock: bigint; toBlock: bigint; event: any; args?: any }, step = 256n) {
      const { address, fromBlock, toBlock, event, args } = params;
      const results: any[] = [];
      let cursor = fromBlock;
      const maxStep = 256n; // smaller to reduce provider timeouts on free tiers
      const effectiveStep = step > maxStep ? maxStep : step;
      if (isDev) console.log("/api/credentials chunk step:", effectiveStep.toString());
      while (cursor <= toBlock) {
        const end = (cursor + effectiveStep) > toBlock ? toBlock : (cursor + effectiveStep);
        let attempt = 0;
        let done = false;
        while (!done && attempt < 3) {
          try {
            const logs = await client.getLogs({ address, fromBlock: cursor, toBlock: end, event, args });
            results.push(...logs);
            done = true;
          } catch (_) {
            attempt++;
            // exponential backoff 200ms, 500ms
            const delay = attempt === 1 ? 200 : 500;
            await new Promise((r) => setTimeout(r, delay));
          }
        }
        // small pacing delay between chunks
        await new Promise((r) => setTimeout(r, 50));
        cursor = end + 1n;
      }
      return results;
    }

    // Fetch only issued logs for the given subject using topic filtering, chunked
    let issuedLogs: any[] = [];
    try {
      issuedLogs = await getLogsChunked(client, {
        address: contract,
        fromBlock: from,
        toBlock: to,
        event: issuedEventAbi,
        args: { subject }, // indexed filter
      }, 800n);
    } catch (e: any) {
      if (isDev) console.error("/api/credentials issued getLogs failed:", e);
      return NextResponse.json({ error: "RPC getLogs (issued) failed", details: isDev ? (e?.message || String(e)) : undefined }, { status: 502 });
    }

    type IssuedEvent = { tokenId: bigint; issuer: Address; subject: Address; cid: string; blockNumber: bigint; transactionHash: Hex };
    const issued: IssuedEvent[] = [];
    for (const log of issuedLogs as Log[]) {
      try {
        const parsed = decodeEventLog({ abi: [issuedEventAbi], data: log.data, topics: log.topics });
        if (parsed.eventName !== "CredentialIssued") continue;
        const { tokenId, issuer, subject: sub, cid } = parsed.args as any;
        issued.push({
          tokenId: BigInt(tokenId),
          issuer: issuer as Address,
          subject: sub as Address,
          cid: String(cid),
          blockNumber: log.blockNumber!,
          transactionHash: log.transactionHash!,
        });
      } catch {}
    }

    // Fetch revoked logs in chunks (skip if no issued for this subject)
    let revokedLogs: any[] = [];
    if (issued.length) {
      try {
        revokedLogs = await getLogsChunked(client, {
          address: contract,
          fromBlock: from,
          toBlock: to,
          event: revokedEventAbi,
        }, 256n);
      } catch (e: any) {
        if (isDev) console.error("/api/credentials revoked getLogs failed:", e);
        return NextResponse.json({ error: "RPC getLogs (revoked) failed", details: isDev ? (e?.message || String(e)) : undefined }, { status: 502 });
      }
    }
    const revokedByToken = new Map<bigint, { tokenId: bigint; blockNumber: bigint }>();
    for (const log of revokedLogs as Log[]) {
      try {
        const parsed = decodeEventLog({ abi: [revokedEventAbi], data: log.data, topics: log.topics });
        if (parsed.eventName !== "CredentialRevoked") continue;
        const { tokenId } = parsed.args as any;
        revokedByToken.set(BigInt(tokenId), { tokenId: BigInt(tokenId), blockNumber: log.blockNumber! });
      } catch {}
    }

    const summaries = issued.map((e) => ({
      tokenId: e.tokenId.toString(),
      issuer: e.issuer,
      subject: e.subject,
      cid: e.cid,
      uri: `ipfs://${e.cid}`,
      gatewayUrl: toGatewayUrl(`ipfs://${e.cid}`),
      issuedAtBlock: e.blockNumber.toString(),
      revoked: revokedByToken.has(e.tokenId),
      revokedAtBlock: revokedByToken.get(e.tokenId)?.blockNumber.toString(),
    }));

    summaries.sort((a, b) => Number(b.issuedAtBlock) - Number(a.issuedAtBlock));
    if (summaries.length === 0) return NextResponse.json([]);
    return NextResponse.json(summaries);
  } catch (e: any) {
    if (isDev) console.error("/api/credentials unhandled error:", e);
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}
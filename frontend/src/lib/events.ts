import { Address, Hex, Log, decodeEventLog, getAbiItem } from "viem";
import { getPublicClient } from "wagmi/actions";
import { credentialSbtAbi, addresses, isValidAddress } from "../contracts";
import { toGatewayUrl } from "./ipfs";
import type { Config } from "wagmi";

export type IssuedEvent = {
  tokenId: bigint;
  issuer: Address;
  subject: Address;
  cid: string;
  blockNumber: bigint;
  transactionHash: Hex;
};

export type RevokedEvent = {
  tokenId: bigint;
  issuer: Address;
  blockNumber: bigint;
  transactionHash: Hex;
};

export type CredentialSummary = {
  tokenId: bigint;
  issuer: Address;
  subject: Address;
  cid: string;
  uri: string; // ipfs://CID
  gatewayUrl: string; // resolved via configured gateway
  issuedAtBlock: bigint;
  revoked: boolean;
  revokedAtBlock?: bigint;
};

const issuedEventAbi = getAbiItem({ abi: credentialSbtAbi as any, name: "CredentialIssued" });
const revokedEventAbi = getAbiItem({ abi: credentialSbtAbi as any, name: "CredentialRevoked" });

export async function fetchCredentialsForSubject(config: Config, subject: Address, fromBlock?: bigint, toBlock?: bigint): Promise<CredentialSummary[]> {
  if (!isValidAddress(addresses.sbt)) throw new Error("SBT address not set");
  const client = getPublicClient(config);
  if (!client) throw new Error("Public client not available");

  const address = addresses.sbt as Address;
  const latest = await client.getBlockNumber();
  const from = fromBlock ?? (latest > 100000n ? (latest - 100000n) : 0n); // limit range for safety
  const to = toBlock ?? latest;

  const issuedLogs = await client.getLogs({
    address,
    fromBlock: from,
    toBlock: to,
    // topics: [signature, issuer, subject]; subject is indexed (3rd topic)
    // We'll filter by subject in topics[2]
    // viem will decode below; here we keep it broad and filter manually as well
  });

  const issued: IssuedEvent[] = [];
  for (const log of issuedLogs as Log[]) {
    try {
      const parsed = decodeEventLog({ abi: [issuedEventAbi], data: log.data, topics: log.topics });
      if (parsed.eventName !== "CredentialIssued") continue;
      const { tokenId, issuer, subject: sub, cid } = parsed.args as any;
      if ((sub as Address).toLowerCase() !== subject.toLowerCase()) continue;
      issued.push({
        tokenId: BigInt(tokenId),
        issuer: issuer as Address,
        subject: sub as Address,
        cid: String(cid),
        blockNumber: log.blockNumber!,
        transactionHash: log.transactionHash!,
      });
    } catch (_) {
      // ignore non-matching logs
    }
  }

  const revokedLogs = await client.getLogs({ address, fromBlock: from, toBlock: to });
  const revokedByToken = new Map<bigint, RevokedEvent>();
  for (const log of revokedLogs as Log[]) {
    try {
      const parsed = decodeEventLog({ abi: [revokedEventAbi], data: log.data, topics: log.topics });
      if (parsed.eventName !== "CredentialRevoked") continue;
      const { tokenId, issuer } = parsed.args as any;
      revokedByToken.set(BigInt(tokenId), {
        tokenId: BigInt(tokenId),
        issuer: issuer as Address,
        blockNumber: log.blockNumber!,
        transactionHash: log.transactionHash!,
      });
    } catch (_) {
      // ignore
    }
  }

  // Merge state
  const summaries: CredentialSummary[] = issued.map((e) => {
    const revoked = revokedByToken.get(e.tokenId);
    const uri = `ipfs://${e.cid}`;
    return {
      tokenId: e.tokenId,
      issuer: e.issuer,
      subject: e.subject,
      cid: e.cid,
      uri,
      gatewayUrl: toGatewayUrl(uri),
      issuedAtBlock: e.blockNumber,
      revoked: !!revoked,
      revokedAtBlock: revoked?.blockNumber,
    };
  });

  // Sort newest first
  summaries.sort((a, b) => Number(b.issuedAtBlock - a.issuedAtBlock));
  return summaries;
}

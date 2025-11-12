export const IPFS_API = process.env.NEXT_PUBLIC_IPFS_API || 'http://localhost:5001/api/v0';
export const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

export async function uploadJsonToIpfs(json: unknown): Promise<string> {
  const body = new FormData();
  const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
  body.append('file', blob, 'metadata.json');

  const res = await fetch(`${IPFS_API}/add`, { method: 'POST', body });
  if (!res.ok) throw new Error(`IPFS add failed: ${res.status}`);
  const data = await res.json();
  // Kubo returns { Hash: CID, Name, Size }
  return data.Hash as string;
}

export function toIpfsUri(cid: string): string {
  if (!cid) return '';
  if (cid.startsWith('ipfs://')) return cid;
  return `ipfs://${cid}`;
}

export function toGatewayUrl(uriOrCid: string): string {
  const cid = uriOrCid.startsWith('ipfs://') ? uriOrCid.slice(7) : uriOrCid;
  return `${IPFS_GATEWAY}${cid}`;
}



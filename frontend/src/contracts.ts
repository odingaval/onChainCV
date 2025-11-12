export const addresses = {
  sbt: process.env.NEXT_PUBLIC_SBT_ADDRESS as any,
  registry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as any,
};

export function isValidAddress(addr?: string | null): addr is `0x${string}` {
  return !!addr && /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export const credentialSbtAbi = [
  {
    "type": "event",
    "name": "CredentialIssued",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "indexed": true },
      { "name": "issuer", "type": "address", "indexed": true },
      { "name": "subject", "type": "address", "indexed": true },
      { "name": "cid", "type": "string", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CredentialRevoked",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "indexed": true },
      { "name": "issuer", "type": "address", "indexed": true }
    ],
    "anonymous": false
  },
  {
    "type": "function",
    "name": "mint",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "cid", "type": "string" }
    ],
    "outputs": [ { "name": "tokenId", "type": "uint256" } ]
  },
  {
    "type": "function",
    "name": "tokenURI",
    "stateMutability": "view",
    "inputs": [ { "name": "tokenId", "type": "uint256" } ],
    "outputs": [ { "name": "", "type": "string" } ]
  },
  {
    "type": "function",
    "name": "ownerOf",
    "stateMutability": "view",
    "inputs": [ { "name": "tokenId", "type": "uint256" } ],
    "outputs": [ { "name": "owner", "type": "address" } ]
  },
  {
    "type": "function",
    "name": "credential",
    "stateMutability": "view",
    "inputs": [ { "name": "tokenId", "type": "uint256" } ],
    "outputs": [
      {
        "components": [
          { "name": "issuer", "type": "address" },
          { "name": "subject", "type": "address" },
          { "name": "cid", "type": "string" },
          { "name": "issuedAt", "type": "uint64" },
          { "name": "revoked", "type": "bool" }
        ],
        "name": "",
        "type": "tuple"
      }
    ]
  },
  {
    "type": "function",
    "name": "revoke",
    "stateMutability": "nonpayable",
    "inputs": [ { "name": "tokenId", "type": "uint256" } ],
    "outputs": []
  }
] as const;

export const issuerRegistryAbi = [
  {
    "type": "function",
    "name": "isIssuer",
    "stateMutability": "view",
    "inputs": [ { "name": "account", "type": "address" } ],
    "outputs": [ { "name": "", "type": "bool" } ]
  },
  {
    "type": "function",
    "name": "addIssuer",
    "stateMutability": "nonpayable",
    "inputs": [ { "name": "issuer", "type": "address" } ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "removeIssuer",
    "stateMutability": "nonpayable",
    "inputs": [ { "name": "issuer", "type": "address" } ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "owner",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [ { "name": "", "type": "address" } ]
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "stateMutability": "nonpayable",
    "inputs": [ { "name": "newOwner", "type": "address" } ],
    "outputs": []
  }
] as const;



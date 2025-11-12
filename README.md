# OnchainCV

A decentralized on-chain skills and achievement passport designed to showcase provable proof‑of‑work in the Web3 ecosystem.

## Overview

OnchainCV issues non‑transferable credentials (SBTs) to wallet addresses. Each credential points to JSON metadata on IPFS (title, description, links). An owner‑managed registry controls who can issue credentials.

## Contracts

- `IssuerRegistry.sol`: Owner‑managed list of authorized issuers. Only owner can add/remove/transfer ownership.
- `CredentialSBT.sol`: Soulbound token with `issuer`, `subject`, `cid`, `issuedAt`, `revoked`. `tokenURI` returns `ipfs://<CID>`; transfers revert.

## Frontend

Next.js + wagmi/viem. Pages:
- `/admin`: Owner adds/removes issuers.
- `/issue`: Issuers upload metadata to IPFS and mint credentials.
- `/view`: View credential by tokenId (issuers can revoke).
- `/my`: List credentials for the connected address from events.

---

# Quick start

- Prereqs: Node 18+, pnpm, Foundry, Docker (for IPFS), a wallet with funds on Moonbase Alpha (chainId 1287).

## 1) Install deps

- Frontend
  - cd frontend
  - pnpm install
- Contracts
  - cd contracts
  - forge build

## 2) Deploy to Moonbase Alpha (1287)

- Set env (use a funded test key)
  - cd contracts
  - Create `.env` with:
    - PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
    - INITIAL_ISSUER=0x0000000000000000000000000000000000000000  # optional, zero = skip
- Deploy
  - forge script script/Deploy.s.sol:Deploy --rpc-url https://rpc.api.moonbase.moonbeam.network --broadcast
- Note the addresses printed:
  - IssuerRegistry: 0x...
  - CredentialSBT: 0x...

## 3) Configure the frontend

- Create `frontend/.env.local`:
  - NEXT_PUBLIC_REGISTRY_ADDRESS=0xYourIssuerRegistry
  - NEXT_PUBLIC_SBT_ADDRESS=0xYourCredentialSBT
  - NEXT_PUBLIC_CHAIN_ID=1287
  - NEXT_PUBLIC_RPC_URL=https://rpc.api.moonbase.moonbeam.network
  - NEXT_PUBLIC_IPFS_API=http://127.0.0.1:5001/api/v0
  - NEXT_PUBLIC_IPFS_GATEWAY=http://127.0.0.1:8080/ipfs/

## 4) Start a local IPFS node (Docker)

- Start Kubo
  - docker run -d --name ipfs -p 8080:8080 -p 5001:5001 ipfs/kubo:release
- Allow browser CORS
  - docker exec ipfs ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3002","http://127.0.0.1:3002","*"]'
  - docker exec ipfs ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET","POST","PUT","OPTIONS"]'
  - docker exec ipfs ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Content-Type","Authorization","X-Requested-With","*"]'
  - docker restart ipfs
- Verify
  - curl -s -X POST http://127.0.0.1:5001/api/v0/version

## 5) Run the frontend

- cd frontend
- PORT=3002 pnpm dev
- Open http://localhost:3002 and connect wallet (Moonbase Alpha / chainId 1287)

---

# Using the app (E2E)

- Admin (owner)
  - /admin → connect with deployer (owner). Paste an address and “Add Issuer”.
- Issue (issuer)
  - /issue → connect with an authorized issuer.
  - Enter recipient, title, description.
  - "Upload JSON → IPFS" or paste a CID.
  - Mint and confirm the tx.
- View (anyone)
  - /view → enter tokenId. View details and metadata.
  - If issuer, you can revoke.
- My (recipient)
  - /my → connected address sees its credentials via event logs.

---

# Troubleshooting

- Wallet connected but reads show “not owner/issuer”
  - Ensure NEXT_PUBLIC_CHAIN_ID=1287 and NEXT_PUBLIC_RPC_URL=https://rpc.api.moonbase.moonbeam.network
  - Restart dev server after env edits; click Refresh on /admin.
- IPFS upload fails
  - Confirm NEXT_PUBLIC_IPFS_API is http://127.0.0.1:5001/api/v0
  - Set CORS headers as above; `docker restart ipfs`
- Gateway fetch fails
  - Try a public gateway temporarily:
    - NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
- Token URI
  - cast call <SBT> "tokenURI(uint256)(string)" <id> --rpc-url https://rpc.api.moonbase.moonbeam.network

---

# Development

- Tests (contracts)
  - cd contracts && forge test -vvv
- Format
  - forge fmt
- Submodule
  - git submodule update --init --recursive

# License

MIT

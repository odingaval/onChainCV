# OnchainCV

A decentralized on-chain skills and achievement passport designed to showcase provable proof‑of‑work in the Web3 ecosystem.

- Live: https://on-chain-cv-gamma.vercel.app/

## Overview

OnchainCV issues non‑transferable credentials (SBTs) to wallet addresses. Each credential points to JSON metadata on IPFS (title, description, links). An owner‑managed registry controls who can issue credentials. The platform also includes a comprehensive profile management system for users to create and share their professional identities.

## Contracts

- `IssuerRegistry.sol`: Owner‑managed list of authorized issuers. Only owner can add/remove/transfer ownership.
- `CredentialSBT.sol`: Soulbound token with `issuer`, `subject`, `cid`, `issuedAt`, `revoked`. `tokenURI` returns `ipfs://<CID>`; transfers revert.

## Frontend

Next.js + wagmi/viem with modern dark theme UI. Pages:
- `/admin`: Owner adds/removes issuers.
- `/issue`: Issuers upload metadata to IPFS and mint credentials.
- `/view`: View credential by tokenId (issuers can revoke).
- `/my`: User profile management with edit/view modes, credential listing, and profile sharing.
- `/view/{address}`: Public profile viewing with customizable privacy settings.

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
- pnpm dev
- Open http://localhost:3000 and connect wallet (Moonbase Alpha / chainId 1287)

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
  - /my → connected address sees its credentials via event logs, manage profile with edit/view modes, and share public profile URL.

---

# Troubleshooting

- Wallet connected but reads show “not owner/issuer”
  - Ensure NEXT_PUBLIC_CHAIN_ID=1287 and NEXT_PUBLIC_RPC_URL uses an HTTPS endpoint (e.g. https://rpc.api.moonbase.moonbeam.network)
  - Restart dev server after env edits; click Refresh on /admin.
- IPFS upload fails
  - Confirm NEXT_PUBLIC_IPFS_API is http://127.0.0.1:5001/api/v0
  - Set CORS headers as above; `docker restart ipfs`
- Gateway fetch fails
  - Try a public gateway temporarily:
    - NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
- My page shows “No credentials found”
  - Not an error. Increase the search window by clicking “Load older history (+5k)” on /my, or call `/api/credentials?address=0x...&window=10000`.
- RPC “block range too wide”
  - The server API chunks requests under provider limits. If you still see it, reduce the window or switch to a faster RPC endpoint.
- Using wss:// RPC URLs
  - Use HTTPS RPCs for server API (e.g., https://rpc.api.moonbase.moonbeam.network). WebSocket URLs won’t work with the current HTTP transport.
- BigInt serialization errors
  - The API returns stringified `tokenId` and block numbers. If you built your own client, parse them as strings.
- Token URI
  - cast call <SBT> "tokenURI(uint256)(string)" <id> --rpc-url https://rpc.api.moonbase.moonbeam.network

---

## Server API (production-friendly)

### Credentials API
- Endpoint: `GET /api/credentials?address=0x...&window=3000`
  - address: checksummed EVM address (required)
  - window: optional block window to search backward from latest (default 3000, capped server-side)
- Behavior
  - Uses topic filtering by subject and chunked `getLogs` to stay under provider limits
  - Returns 204 No Content if no credentials found in the window
  - JSON fields: `tokenId` (string), `issuer` (string), `subject` (string), `cid` (string), `uri` (string), `gatewayUrl` (string), `issuedAtBlock` (string), `revoked` (boolean), `revokedAtBlock` (string | undefined)
- Tip: Hit the endpoint directly in a browser to debug.

### Profile API
- Endpoint: `GET /api/profile?address=0x...`
  - address: checksummed EVM address (required)
  - Returns user profile data including personal info, skills, experience, and privacy settings
- Endpoint: `POST /api/profile`
  - Creates or updates user profile with validation
  - Supports profile image uploads and metadata management
- Endpoint: `GET /api/search?q=...`
  - Search profiles by name, skills, or other criteria
  - Returns paginated results with profile previews

---

## Deployment

- Production URL: https://on-chain-cv-gamma.vercel.app/

- Environment variables (frontend/.env.production or platform env):
  - NEXT_PUBLIC_REGISTRY_ADDRESS=0xYourIssuerRegistry
  - NEXT_PUBLIC_SBT_ADDRESS=0xYourCredentialSBT
  - NEXT_PUBLIC_CHAIN_ID=1287
  - NEXT_PUBLIC_RPC_URL=https://rpc.api.moonbase.moonbeam.network (HTTPS)
  - NEXT_PUBLIC_IPFS_API=http://127.0.0.1:5001/api/v0 (or your hosted IPFS API)
  - NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/ (or your gateway)
- Build & start locally (prod):
  - cd frontend
  - pnpm build
  - pnpm start  # defaults to port 3000
- Vercel
  - Import the frontend project, set the envs above in Project Settings → Environment Variables
  - Framework: Next.js; Build command: `next build`; Output: Next.js default
  - Recommended: set a fast region near Moonbase RPC and your users
- Self-host / Docker (optional)
  - Create a Dockerfile that runs `next build` then `next start`
  - Ensure envs are passed at runtime; expose port 3000
- Next.js config (optional)
  - You can add `turbopack: { root: __dirname }` in `next.config.js` to silence workspace root warnings in dev

---

# Development

- Tests (contracts)
  - cd contracts && forge test -vvv
- Format
  - forge fmt
- Submodule
  - git submodule update --init --recursive

# License

MIT.

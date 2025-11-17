import { http, createConfig } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { sepolia, moonbaseAlpha } from 'wagmi/chains';

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network';
const chainIdEnv = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '1287');
const chain = chainIdEnv === moonbaseAlpha.id
  ? moonbaseAlpha
  : chainIdEnv === sepolia.id
    ? sepolia
    : moonbaseAlpha; // default to Moonbase Alpha

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const config = createConfig({
  chains: [chain],
  connectors: [
    injected(),
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId })] : []),
  ],
  transports: ({ [chain.id]: http(rpcUrl) } as any),
  ssr: true,
});



import { type Network } from "./schema";

// Comprehensive Superchain Network configurations - ordered display
export const SUPPORTED_NETWORKS: (Omit<Network, 'createdAt'>)[] = [
  {
    id: "sepolia",
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    nativeCurrency: "ETH",
    explorerUrl: "https://sepolia.etherscan.io",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/ethereum.svg",
  },
  {
    id: "base-sepolia",
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    nativeCurrency: "ETH",
    explorerUrl: "https://sepolia.basescan.org",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/base.svg",
  },
  {
    id: "optimism-sepolia",
    name: "Optimism Sepolia",
    chainId: 11155420,
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
    nativeCurrency: "ETH",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/optimism.svg",
  },
  {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
    nativeCurrency: "ETH",
    explorerUrl: "https://sepolia.arbiscan.io",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/arbitrum.svg",
  },
  {
    id: "ink-sepolia",
    name: "Ink Sepolia",
    chainId: 763373,
    rpcUrl: process.env.INK_SEPOLIA_RPC_URL || "https://rpc-gel-sepolia.inkonchain.com",
    nativeCurrency: "ETH",
    explorerUrl: "https://explorer-sepolia.inkonchain.com",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/ink.svg",
  },
  {
    id: "mode-sepolia",
    name: "Mode Sepolia",
    chainId: 919,
    rpcUrl: process.env.MODE_SEPOLIA_RPC_URL || "https://sepolia.mode.network",
    nativeCurrency: "ETH",
    explorerUrl: "https://sepolia.explorer.mode.network",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/mode.svg",
  },
  {
    id: "zora-sepolia",
    name: "Zora Sepolia",
    chainId: 999999999,
    rpcUrl: process.env.ZORA_SEPOLIA_RPC_URL || "https://sepolia.rpc.zora.energy",
    nativeCurrency: "ETH",
    explorerUrl: "https://sepolia.explorer.zora.energy",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/zora.svg",
  },
  {
    id: "unichain-sepolia",
    name: "Unichain Sepolia",
    chainId: 1301,
    rpcUrl: process.env.UNICHAIN_SEPOLIA_RPC_URL || "https://sepolia.unichain.org",
    nativeCurrency: "ETH",
    explorerUrl: "https://sepolia.uniscan.xyz",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/unichain.svg",
  },
  {
    id: "blast-sepolia",
    name: "Blast Sepolia",
    chainId: 168587773,
    rpcUrl: process.env.BLAST_SEPOLIA_RPC_URL || "https://sepolia.blast.io",
    nativeCurrency: "ETH",
    explorerUrl: "https://testnet.blastscan.io",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/blast.svg",
  },
  {
    id: "frax-sepolia",
    name: "Frax Sepolia",
    chainId: 2522,
    rpcUrl: process.env.FRAX_SEPOLIA_RPC_URL || "https://rpc.testnet.frax.com",
    nativeCurrency: "frxETH",
    explorerUrl: "https://holesky.fraxscan.com",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/frax.svg",
  },
  {
    id: "cyber-sepolia",
    name: "Cyber Sepolia",
    chainId: 111557560,
    rpcUrl: process.env.CYBER_SEPOLIA_RPC_URL || "https://cyber-testnet.alt.technology",
    nativeCurrency: "ETH",
    explorerUrl: "https://testnet.cyberscan.co",
    faucetAmount: "0.001",
    isActive: true,
    iconUrl: "/networks/cyber.svg",
  },
];

// Functions to interact with the static network data
// Note: These no longer interact with a database

export function getActiveNetworks(): Network[] {
  // Cast to Network to satisfy the type from the no-longer-used schema
  return SUPPORTED_NETWORKS.filter(n => n.isActive) as Network[];
}

export function getAllNetworks(): Network[] {
  return SUPPORTED_NETWORKS as Network[];
}

export function getNetworkByChainId(chainId: number): Network | null {
  return (SUPPORTED_NETWORKS.find(n => n.chainId === chainId) || null) as Network | null;
}

export function getNetworkById(id: string): Network | null {
  return (SUPPORTED_NETWORKS.find(n => n.id === id) || null) as Network | null;
}

// Admin functions are no longer relevant as data is static
// You would manage network status by changing `isActive` in the SUPPORTED_NETWORKS array
export async function updateNetwork(networkId: string, updates: Partial<Network>): Promise<Network | null> {
    console.warn("Network management is now static. Update the `SUPPORTED_NETWORKS` array in `src/lib/networks.ts`");
    const network = getNetworkById(networkId);
    if (network) {
        // This is a temporary, in-memory update and will not persist.
        Object.assign(network, updates);
        return network;
    }
    return null;
}

export async function getAdminStats() {
    // Stats are no longer tracked as claims are not stored in a database.
    console.warn("Claim stats are not available without a persistent database.");
    return {
        totalClaims: 0,
        uniqueClaimers: 0,
        totalAmountClaimed: "0",
    }
}


import { db } from "./db";
import { networks, faucetClaims, type Network, type InsertNetwork } from "./schema";
import { eq, sql, desc, count } from "drizzle-orm";
import { z } from "zod";


// Comprehensive Superchain Network configurations - ordered display
export const SUPPORTED_NETWORKS: InsertNetwork[] = [
  {
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

// Initialize networks in database
export async function initializeNetworks() {
  try {
    const existingNetworks = await db.select({ chainId: networks.chainId }).from(networks);
    const existingChainIds = new Set(existingNetworks.map(n => n.chainId));

    for (const networkConfig of SUPPORTED_NETWORKS) {
      if (networkConfig.chainId && !existingChainIds.has(networkConfig.chainId)) {
        await db.insert(networks).values(networkConfig);
        console.log(`✓ Initialized network: ${networkConfig.name} (Chain ${networkConfig.chainId})`);
      }
    }
  } catch (error) {
    console.error("Failed to initialize networks:", error);
  }
}

export async function getActiveNetworks(): Promise<Network[]> {
  return await db
    .select()
    .from(networks)
    .orderBy(desc(networks.name))
    .where(eq(networks.isActive, true));
}

export async function getAllNetworks(): Promise<Network[]> {
  return await db.select().from(networks).orderBy(desc(networks.name));
}

export async function getNetworkByChainId(chainId: number): Promise<Network | null> {
  const result = await db
    .select()
    .from(networks)
    .where(eq(networks.chainId, chainId))
    .limit(1);
  
  return result[0] || null;
}

export async function getNetworkById(id: string): Promise<Network | null> {
  const result = await db
    .select()
    .from(networks)
    .where(eq(networks.id, id))
    .limit(1);
  
  return result[0] || null;
}

const updateNetworkSchema = z.object({
  faucetAmount: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function updateNetwork(networkId: string, updates: z.infer<typeof updateNetworkSchema>): Promise<Network | null> {
  const result = await db
    .update(networks)
    .set(updates)
    .where(eq(networks.id, networkId))
    .returning();

  return result[0] || null;
}


export async function getAdminStats() {
    const totalClaimsResult = await db.select({
        count: count()
    }).from(faucetClaims);
    
    const uniqueClaimersResult = await db.select({
       count: count(sql`distinct "wallet_address"`)
    }).from(faucetClaims);

    const totalAmountClaimedResult = await db.select({
      total: sql<string>`sum(amount::decimal)`
    }).from(faucetClaims);

    return {
        totalClaims: totalClaimsResult[0].count,
        uniqueClaimers: uniqueClaimersResult[0].count,
        totalAmountClaimed: totalAmountClaimedResult[0].total || "0",
    }
}

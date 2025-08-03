export interface Chain {
  id: number;
  name: string;
  rpcEnvVar: string;
  explorerUrl: string;
}

export const chains: Chain[] = [
  {
    id: 84532,
    name: "Base Sepolia",
    rpcEnvVar: "BASE_SEPOLIA_RPC_URL",
    explorerUrl: "https://sepolia.basescan.org",
  },
  {
    id: 11155420,
    name: "Optimism Sepolia",
    rpcEnvVar: "OPTIMISM_SEPOLIA_RPC_URL",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
  },
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    rpcEnvVar: "ARBITRUM_SEPOLIA_RPC_URL",
    explorerUrl: "https://sepolia.arbiscan.io",
  },
  {
    id: 763373,
    name: "Ink Sepolia",
    rpcEnvVar: "INK_SEPOLIA_RPC_URL",
    explorerUrl: "https://sepolia.inkscan.io",
  },
  {
    id: 919,
    name: "Mode Sepolia",
    rpcEnvVar: "MODE_SEPOLIA_RPC_URL",
    explorerUrl: "https://sepolia.modescan.io",
  },
  {
    id: 999999999,
    name: "Zora Sepolia",
    rpcEnvVar: "ZORA_SEPOLIA_RPC_URL",
    explorerUrl: "https://sepolia.explorer.zora.energy",
  },
  {
    id: 1301,
    name: "Unichain Sepolia",
    rpcEnvVar: "UNICHANNEL_SEPOLIA_RPC_URL",
    explorerUrl: "https://testnet.unichain.world",
  },
  {
    id: 168587773,
    name: "Blast Sepolia",
    rpcEnvVar: "BLAST_SEPOLIA_RPC_URL",
    explorerUrl: "https://sepolia.blastscan.io",
  },
  {
    id: 2522,
    name: "Frax Sepolia",
    rpcEnvVar: "FRAX_SEPOLIA_RPC_URL",
    explorerUrl: "https://sepolia.fraxscan.com",
  },
  {
    id: 111557560,
    name: "Cyber Sepolia",
    rpcEnvVar: "CYBER_SEPOLIA_RPC_URL",
    explorerUrl: "https://sepolia.cyberscan.io",
  },
];

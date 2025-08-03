
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { SUPPORTED_NETWORKS } from "@/lib/networks";

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = 'YOUR_PROJECT_ID'

// 2. Create wagmiConfig
const metadata = {
  name: 'Superchain Faucet',
  description: 'A multi-chain faucet for Sepolia testnets',
  url: 'https://web3modal.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Map supported networks to wagmi chains
const chains = SUPPORTED_NETWORKS.map(network => ({
  id: network.chainId,
  name: network.name,
  nativeCurrency: { name: network.nativeCurrency, symbol: network.nativeCurrency, decimals: 18 },
  rpcUrls: {
    default: { http: [network.rpcUrl || ''] },
    public: { http: [network.rpcUrl || ''] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: network.explorerUrl },
  },
  testnet: true,
}));

const config = createConfig({
  chains: [mainnet, sepolia, ...chains],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    ...chains.reduce((acc, chain) => {
      acc[chain.id] = http();
      return acc;
    }, {} as Record<number, any>),
  },
  projectId,
  metadata,
  ssr: true,
})

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true // Optional - false as default
})


export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

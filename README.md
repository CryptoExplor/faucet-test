# SepoliaDrop Faucet

This is a Next.js application that functions as a multi-chain faucet for various Sepolia testnets. It allows users to connect their MetaMask wallet, verify their humanity using a Gitcoin Passport score, and claim testnet ETH on a supported network.

## Features

- **Wallet Connection**: Connect with MetaMask.
- **Multi-Chain Support**: Dispenses funds on 10 different Sepolia testnets.
- **Sybil Resistance**: Uses Gitcoin Passport score to determine eligibility for claiming tokens.
- **Modern UI**: Built with Next.js, TypeScript, and shadcn/ui for a clean, responsive, and world-class user experience.
- **Server-Side Logic**: Securely handles faucet drips using Next.js Server Actions.

## Getting Started

To get started, you'll need to set up your environment variables. Create a `.env.local` file in the root of the project and add the following:

```
# The mnemonic for the wallet that will be used to dispense funds.
# IMPORTANT: This wallet must be funded with testnet ETH on all supported chains.
FAUCET_MNEMONIC="your twelve word mnemonic phrase here"

# RPC URLs for each supported Sepolia testnet.
# You can get these from providers like Infura, Alchemy, or public RPC lists.
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
OPTIMISM_SEPOLIA_RPC_URL="https://sepolia.optimism.io"
ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
// ... and so on for all 10 chains
INK_SEPOLIA_RPC_URL="..."
MODE_SEPOLIA_RPC_URL="..."
ZORA_SEPOLIA_RPC_URL="..."
UNICHANNEL_SEPOLIA_RPC_URL="..."
BLAST_SEPOLIA_RPC_URL="..."
FRAX_SEPOLIA_RPC_URL="..."
CYBER_SEPOLIA_RPC_URL="..."
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

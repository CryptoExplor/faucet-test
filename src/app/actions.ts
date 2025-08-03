"use server";

import { ethers } from "ethers";
import { z } from "zod";
import { chains } from "@/lib/chains";

export async function claimTokens(address: string, chainId: number) {
  const schema = z.object({
    address: z.string().refine((addr) => ethers.isAddress(addr), {
      message: "Invalid Ethereum address provided.",
    }),
    chainId: z.number().int(),
  });

  const validation = schema.safeParse({ address, chainId });
  if (!validation.success) {
    return { ok: false, message: validation.error.errors[0].message };
  }

  const mnemonic = process.env.FAUCET_MNEMONIC;
  if (!mnemonic) {
    console.error("FAUCET_MNEMONIC not set in .env file");
    return { ok: false, message: "Server configuration error." };
  }

  const selectedChain = chains.find((c) => c.id === chainId);
  if (!selectedChain) {
    return { ok: false, message: "Unsupported chain ID." };
  }

  const rpcUrl = process.env[selectedChain.rpcEnvVar];
  if (!rpcUrl) {
    console.error(`${selectedChain.rpcEnvVar} not set for chain ID ${chainId}`);
    return { ok: false, message: "Server configuration error for selected chain." };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);

    const balance = await provider.getBalance(wallet.address);
    const amountToSend = ethers.parseEther("0.01");

    if (balance < amountToSend) {
      console.error(`Faucet wallet has insufficient funds on chain ${chainId}.`);
      return { ok: false, message: "Faucet is currently out of funds. Please try again later." };
    }

    const tx = await wallet.sendTransaction({
      to: address,
      value: amountToSend,
    });

    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
        return { ok: false, message: "Transaction failed to confirm."}
    }

    return { ok: true, txHash: receipt.hash, message: "Transaction successful!" };
  } catch (error: any) {
    console.error(`Faucet error on chain ${chainId}:`, error);

    if (error.code === 'INSUFFICIENT_FUNDS') {
        return { ok: false, message: "Faucet is out of funds on this network." };
    }
    
    return { ok: false, message: error.reason || "An unexpected error occurred during the transaction." };
  }
}


"use server";

import { ethers } from "ethers";
import { z } from "zod";
import { getNetworkByChainId } from "@/lib/networks";
import { db } from "@/lib/db";
import { faucetClaims, networks } from "@/lib/schema";
import { and, eq, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";


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

  const selectedChain = await getNetworkByChainId(chainId);
  if (!selectedChain) {
    return { ok: false, message: "Unsupported chain ID." };
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentClaim = await db.query.faucetClaims.findFirst({
    where: and(
        eq(faucetClaims.walletAddress, address),
        eq(faucetClaims.networkId, selectedChain.id),
        gte(faucetClaims.claimedAt, twentyFourHoursAgo)
    )
  });

  if (recentClaim) {
      return { ok: false, message: "You have already claimed tokens on this network in the last 24 hours." };
  }


  const mnemonic = process.env.FAUCET_MNEMONIC;
  if (!mnemonic) {
    console.error("FAUCET_MNEMONIC not set in .env file");
    return { ok: false, message: "Server configuration error." };
  }
  
  const rpcUrl = selectedChain.rpcUrl;
  if (!rpcUrl) {
    console.error(`RPC URL not set for chain ID ${chainId}`);
    return { ok: false, message: "Server configuration error for selected chain." };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);

    const balance = await provider.getBalance(wallet.address);
    const amountToSend = ethers.parseEther(selectedChain.faucetAmount);

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

    await db.insert(faucetClaims).values({
        walletAddress: address,
        networkId: selectedChain.id,
        amount: selectedChain.faucetAmount,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
    });


    return { ok: true, txHash: receipt.hash, message: "Transaction successful!" };
  } catch (error: any) {
    console.error(`Faucet error on chain ${chainId}:`, error);

    if (error.code === 'INSUFFICIENT_FUNDS') {
        return { ok: false, message: "Faucet is out of funds on this network." };
    }
    
    return { ok: false, message: error.reason || "An unexpected error occurred during the transaction." };
  }
}

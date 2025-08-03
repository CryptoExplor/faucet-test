
"use server";

import { ethers } from "ethers";
import { z } from "zod";
import { getNetworkByChainId, getNetworkById } from "@/lib/networks";
import { db } from "@/lib/db";
import { faucetClaims } from "@/lib/schema";
import { and, eq, gte } from "drizzle-orm";


export async function claimTokens(address: string, chainId: number, passportScore: number) {
  const schema = z.object({
    address: z.string().refine((addr) => ethers.isAddress(addr), {
      message: "Invalid Ethereum address provided.",
    }),
    chainId: z.number().int(),
    passportScore: z.number(),
  });

  const validation = schema.safeParse({ address, chainId, passportScore });
  if (!validation.success) {
    return { ok: false, message: validation.error.errors[0].message };
  }

  const selectedChain = await getNetworkByChainId(chainId);
  if (!selectedChain) {
    return { ok: false, message: "Unsupported chain ID." };
  }
  
  if (!selectedChain.isActive) {
      return { ok: false, message: `${selectedChain.name} faucet is currently disabled.` };
  }

  // Verify Passport score threshold
  if (passportScore < 10) {
    return { ok: false, message: "Insufficient Gitcoin Passport score. Minimum required: 10" };
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentClaim = await db.query.faucetClaims.findFirst({
    where: and(
        eq(faucetClaims.walletAddress, address.toLowerCase()),
        eq(faucetClaims.networkId, selectedChain.id),
        gte(faucetClaims.claimedAt, twentyFourHoursAgo)
    )
  });

  if (recentClaim) {
      const nextClaimTime = new Date(recentClaim.claimedAt.getTime() + 24 * 60 * 60 * 1000);
      return { ok: false, message: `You have already claimed tokens on this network in the last 24 hours. Please try again after ${nextClaimTime.toLocaleString()}.` };
  }


  const mnemonic = process.env.FAUCET_MNEMONIC;
  if (!mnemonic) {
    console.error("FAUCET_MNEMONIC not set in .env file");
    return { ok: false, message: "Server configuration error. Faucet is not configured." };
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
        walletAddress: address.toLowerCase(),
        networkId: selectedChain.id,
        amount: selectedChain.faucetAmount,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        passportScore: String(passportScore),
    });


    return { ok: true, txHash: receipt.hash, message: "Transaction successful!", network: selectedChain };
  } catch (error: any) {
    console.error(`Faucet error on chain ${chainId}:`, error);

    if (error.code === 'INSUFFICIENT_FUNDS') {
        return { ok: false, message: "Faucet is out of funds on this network." };
    }
     if (error.code === 'NETWORK_ERROR') {
        return { ok: false, message: "Network error. Please try again later." };
    }
    
    return { ok: false, message: error.reason || "An unexpected error occurred during the transaction." };
  }
}

export async function checkRateLimit(address: string, networkId: string) {
    const network = await getNetworkById(networkId);
    if (!network) {
        return { isRateLimited: false, remainingTime: null };
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentClaim = await db.query.faucetClaims.findFirst({
        where: and(
            eq(faucetClaims.walletAddress, address.toLowerCase()),
            eq(faucetClaims.networkId, networkId),
            gte(faucetClaims.claimedAt, twentyFourHoursAgo)
        ),
        orderBy: (claims, { desc }) => [desc(claims.claimedAt)],
    });

    if (recentClaim) {
        const nextClaimTime = new Date(recentClaim.claimedAt.getTime() + 24 * 60 * 60 * 1000);
        const remainingTime = nextClaimTime.getTime() - Date.now();
        return { isRateLimited: true, remainingTime: remainingTime > 0 ? remainingTime : 0 };
    }

    return { isRateLimited: false, remainingTime: null };
}

export async function getPassportScore(address: string) {
    // This function will be replaced by the Genkit flow, 
    // but we have a placeholder for the frame's direct API call.
    try {
        const response = await fetch(`https://api.scorer.gitcoin.co/registry/score/${process.env.GITCOIN_SCORER_ID}/${address}`, {
             headers: {
                'X-API-KEY': process.env.GITCOIN_API_KEY as string,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            return { score: 0, isEligible: false };
        }
        const data = await response.json();
        const score = parseFloat(data.score || "0");
        return { score, isEligible: score >= 10 };
    } catch (error) {
        console.error("Error fetching Gitcoin score for frame:", error);
        return { score: 0, isEligible: false };
    }
}

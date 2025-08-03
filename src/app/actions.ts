
"use server";

import { ethers } from "ethers";
import { z } from "zod";
import { getNetworkByChainId } from "@/lib/networks";
import { Redis } from "@upstash/redis";

// Initialize Redis client for rate limiting
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limiting constants
const RATE_LIMIT_HOURS = 24; // 24 hours
const RATE_LIMIT_SECONDS = RATE_LIMIT_HOURS * 60 * 60;
const ELIGIBILITY_THRESHOLD = 10;

export async function getPassportScore(address: string) {
    const apiKey = process.env.GITCOIN_API_KEY;
    const scorerId = process.env.GITCOIN_SCORER_ID;

    if (!apiKey || !scorerId) {
      console.error("Gitcoin API credentials not configured. Set GITCOIN_API_KEY and GITCOIN_SCORER_ID.");
      return { score: 0, isEligible: false };
    }

    try {
      const response = await fetch(`https://api.scorer.gitcoin.co/registry/score/${scorerId}/${address}`, {
           headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      });

      if (response.ok) {
          const data = await response.json();
          const score = parseFloat(data.score || "0");
          return { score, isEligible: score >= ELIGIBILITY_THRESHOLD };
      } else {
           const errorBody = await response.text();
          console.error(`Gitcoin API Error for ${address}: ${errorBody}`);
      }

    } catch (error) {
        console.error(`Error fetching Gitcoin score for ${address}:`, error);
    }
    
    // Default to a score of 0 in case of any errors
    return { score: 0, isEligible: false };
}


export async function claimTokens(address: string, chainId: number, passportScore: number) {
  if (!redis) {
    console.error("Upstash Redis not configured. Rate limiting is disabled.");
    return { ok: false, message: "Server configuration error: Rate limiting service is unavailable." };
  }
  
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

  const selectedChain = getNetworkByChainId(chainId);
  if (!selectedChain) {
    return { ok: false, message: "Unsupported chain ID." };
  }
  
  if (!selectedChain.isActive) {
      return { ok: false, message: `${selectedChain.name} faucet is currently disabled.` };
  }

  // Verify Passport score threshold
  if (passportScore < ELIGIBILITY_THRESHOLD) {
    return { ok: false, message: "Insufficient Gitcoin Passport score. Minimum required: 10" };
  }

  const rateLimitKey = `faucet:${address.toLowerCase()}:${selectedChain.id}`;
  const existingClaim = await redis.get(rateLimitKey);

  if (existingClaim) {
    const remainingTime = await redis.ttl(rateLimitKey);
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    return { ok: false, message: `You have already claimed on this network. Please try again in ${hours}h ${minutes}m.` };
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
    
    // Set rate limit flag in Redis
    await redis.set(rateLimitKey, "claimed", { ex: RATE_LIMIT_SECONDS });


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
    if (!redis) {
        console.error("Upstash Redis not configured. Cannot check rate limit.");
        return { isRateLimited: false, remainingTime: null };
    }
    const rateLimitKey = `faucet:${address.toLowerCase()}:${networkId}`;
    const remainingTime = await redis.ttl(rateLimitKey);

    if (remainingTime > 0) {
        return { isRateLimited: true, remainingTime: remainingTime * 1000 }; // convert to ms
    }

    return { isRateLimited: false, remainingTime: null };
}

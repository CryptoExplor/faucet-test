
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
const ELIGIBILITY_THRESHOLD = 8;

export async function getPassportScore(address: string) {
    const apiKey = process.env.GITCOIN_PASSPORT_API_KEY;
    const scorerId = process.env.GITCOIN_SCORER_ID;

    if (!apiKey || !scorerId) {
      console.error("Gitcoin API credentials not configured. Set GITCOIN_PASSPORT_API_KEY and GITCOIN_SCORER_ID.");
      // Return a default score instead of an error to allow claim checks to proceed
      return { score: 0, status: "ERROR", error: "Server configuration error." };
    }

    try {
      // Corrected URL: scorerId is a query parameter
      const response = await fetch(`https://api.scorer.gitcoin.co/registry/score/${address}?scorer_id=${scorerId}`, {
           headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      });

      if (response.status === 404) {
          console.log(`No Gitcoin Passport found for address: ${address}`);
          return { score: 0, status: "NOT_FOUND" };
      }

      if (response.ok) {
          const data = await response.json();
          // Ensure score is a number, defaulting to 0 if null or invalid
          const score = data.score ?? 0;
          return { ...data, score: score };
      } else {
           const errorBody = await response.json();
           console.error(`Gitcoin API Error for ${address}: ${response.status}`, errorBody);
           return { score: 0, status: "ERROR", error: errorBody.detail || "Gitcoin API Error" };
      }

    } catch (error) {
        console.error(`Error fetching Gitcoin score for ${address}:`, error);
        return { score: 0, status: "ERROR", error: "Failed to communicate with Gitcoin API." };
    }
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
    return { ok: false, message: `Insufficient Gitcoin Passport score. Minimum required: ${ELIGIBILITY_THRESHOLD}` };
  }

  const rateLimitKey = `faucet:${address.toLowerCase()}:${selectedChain.id}`;
  const existingClaim = await redis.get(rateLimitKey);

  if (existingClaim) {
    const remainingTime = await redis.ttl(rateLimitKey);
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    return { ok: false, message: `You have already claimed on this network. Please try again in ${hours}h ${minutes}m.` };
  }


  const privateKey = process.env.FAUCET_PRIVATE_KEY;
  if (!privateKey) {
    console.error("FAUCET_PRIVATE_KEY not set in .env file");
    return { ok: false, message: "Server configuration error. Faucet is not configured." };
  }
  
  const rpcUrl = selectedChain.rpcUrl;
  if (!rpcUrl) {
    console.error(`RPC URL not set for chain ID ${chainId}`);
    return { ok: false, message: "Server configuration error for selected chain." };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

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

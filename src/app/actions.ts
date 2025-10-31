"use server";

import { ethers } from "ethers";
import { z } from "zod";
import { getNetworkByChainId } from "@/lib/networks";
import { kv } from "@vercel/kv";
import { Passport, PassportStatus } from "@/lib/passport/types";

// Rate limiting constants
const RATE_LIMIT_HOURS = 168;
const RATE_LIMIT_SECONDS = RATE_LIMIT_HOURS * 60 * 60;
const ELIGIBILITY_THRESHOLD = 10;

export async function getPassportScore(address: string): Promise<Passport> {
    const apiKey = process.env.GITCOIN_PASSPORT_API_KEY;
    const scorerId = process.env.GITCOIN_SCORER_ID;

    if (!apiKey || !scorerId) {
      console.error("Gitcoin API credentials not configured. Set GITCOIN_PASSPORT_API_KEY and GITCOIN_SCORER_ID.");
      return { address, score: 0, status: PassportStatus.ERROR, error: "Gitcoin API credentials not configured on the server.", last_score_timestamp: new Date().toISOString() };
    }

    try {
      const response = await fetch(`https://api.passport.xyz/v2/stamps/${scorerId}/score/${address}`, {
           headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      });

      if (response.status === 404) {
          console.log(`No Gitcoin Passport found for address: ${address}`);
          return { address, score: 0, status: PassportStatus.NOT_FOUND, last_score_timestamp: new Date().toISOString() };
      }

      const data = await response.json();

      if (response.ok) {
          let finalScore = 0;
          if (data.score) {
              finalScore = parseFloat(data.score);
          }
          
          if (isNaN(finalScore)) {
              finalScore = 0;
          }

          return {
            ...data,
            address,
            score: finalScore,
            status: PassportStatus.DONE,
          } as Passport;
      } else {
           const errorDetail = data.detail || "Gitcoin API Error";
           console.error(`Gitcoin API Error for ${address}: ${response.status}`, errorDetail);
           return { address, score: 0, status: PassportStatus.ERROR, error: errorDetail, last_score_timestamp: new Date().toISOString() };
      }

    } catch (error) {
        console.error(`Error fetching Gitcoin score for ${address}:`, error);
        return { address, score: 0, status: PassportStatus.ERROR, error: "Failed to communicate with Gitcoin API.", last_score_timestamp: new Date().toISOString() };
    }
}


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
  
  try {
    const existingClaim = await kv.get(rateLimitKey);

    if (existingClaim) {
      const remainingTime = await kv.ttl(rateLimitKey);
      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      return { ok: false, message: `You have already claimed on this network. Please try again in ${hours}h ${minutes}m.` };
    }
  } catch (error) {
    console.error("Vercel KV error checking rate limit:", error);
    return { ok: false, message: "Rate limiting service unavailable. Please try again later." };
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
    
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice;

    if (!gasPrice) {
        return { ok: false, message: "Could not estimate gas price. The network may be busy."}
    }

    // Increase gas price by 20% to ensure transaction is processed
    const boostedGasPrice = (gasPrice * 120n) / 100n;

    const tx = await wallet.sendTransaction({
      to: address,
      value: amountToSend,
      gasPrice: boostedGasPrice,
    });

    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
        return { ok: false, message: "Transaction failed to confirm."}
    }
    
    // Set rate limit flag in Vercel KV
    try {
      await kv.set(rateLimitKey, "claimed", { ex: RATE_LIMIT_SECONDS });
    } catch (error) {
      console.error("Vercel KV error setting rate limit:", error);
      // Don't fail the transaction if rate limiting fails to be set
    }

    return { ok: true, txHash: receipt.hash, message: "Transaction successful!", network: selectedChain };
  } catch (error: any) {
    console.error(`Faucet error on chain ${chainId}:`, error);

    if (error.code === 'INSUFFICIENT_FUNDS') {
        return { ok: false, message: "Faucet is out of funds on this network." };
    }
     if (error.code === 'NETWORK_ERROR' || error.code === 'SERVER_ERROR') {
        return { ok: false, message: "Network error. Please try again later." };
    }
    
    return { ok: false, message: error.reason || "An unexpected error occurred during the transaction." };
  }
}

export async function checkRateLimit(address: string, networkId: string) {
    try {
      const rateLimitKey = `faucet:${address.toLowerCase()}:${networkId}`;
      const remainingTime = await kv.ttl(rateLimitKey);

      if (remainingTime > 0) {
          return { isRateLimited: true, remainingTime: remainingTime * 1000 };
      }

      return { isRateLimited: false, remainingTime: null };
    } catch (error) {
      console.error("Vercel KV error checking rate limit:", error);
      return { isRateLimited: false, remainingTime: null };
    }
}

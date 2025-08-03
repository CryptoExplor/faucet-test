
import { Address } from "viem";
import type { Passport } from "./types";

export const getScore = async (address: Address): Promise<Passport | null> => {
  try {
    const response = await fetch(`/api/passport/${address}`);
    if (!response.ok) {
        if (response.status === 404) {
            // Handle case where passport is not found, which is not a server error
            return null;
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch passport score' }));
        throw new Error(errorData.message);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching passport score:", error);
    throw error;
  }
};

export const submitPassport = async (address: Address): Promise<Passport | null> => {
    // This function is a placeholder for a potential future implementation
    // where a passport needs to be explicitly submitted or created.
    // For now, it can just re-fetch the score.
    return getScore(address);
}

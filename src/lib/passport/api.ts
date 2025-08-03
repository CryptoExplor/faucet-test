
import { Address } from "viem";
import type { Passport } from "./types";

export const getScore = async (address: Address): Promise<Passport> => {
  try {
    const response = await fetch(`/api/passport/${address}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch passport score' }));
        throw new Error(errorData.message);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching passport score:", error);
    throw error;
  }
};

export const submitPassport = async (address: Address): Promise<Passport> => {
    try {
        const response = await fetch(`/api/passport/${address}`, { method: 'POST' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to submit passport' }));
            throw new Error(errorData.message);
        }
        return response.json();
    } catch (error) {
        console.error("Error submitting passport:", error);
        throw error;
    }
}

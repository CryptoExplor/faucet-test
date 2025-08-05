"use client";

import { Address } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";

import { Passport, PassportStatus } from "./types";
import { Context } from "./Provider";
import { getPassportScore } from "@/app/actions";

export function usePassport() {
  return useContext(Context);
}

// This hook calls the server action to fetch the score
export function usePassportScore(address?: Address) {
  return useQuery({
    queryKey: ["score", address],
    queryFn: async (): Promise<Passport | null> => {
      if (!address) return null;
      // getPassportScore now returns a properly typed Passport object
      return await getPassportScore(address);
    },
    enabled: !!address,
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && typeof data === "object" && "status" in data) {
        return (data as Passport).status === PassportStatus.PROCESSING ? 2000 : false;
      }
      return false;
    },
  });
}

// This hook is a placeholder for a submission action if one were to be implemented.
// Currently, Gitcoin submission is handled by them, so this is not actively used
// but is kept for architectural completeness.
export function usePassportSubmit(address?: Address) {
  const client = useQueryClient();

  return useMutation<Passport, Error, void, unknown>({
    mutationFn: async (): Promise<Passport> => {
      if (!address) throw new Error("address not provided");
      // In a real scenario, this would call a server action to trigger submission.
      // For now, we just refetch the score by simulating a "processing" state.
      console.log("Triggering Passport submission/refresh for", address);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            score: null,
            address,
            status: PassportStatus.PROCESSING,
            last_score_timestamp: new Date().toISOString(),
          } as Passport);
        }, 1000);
      });
    },
    onSettled: () => {
        if(address) {
            client.invalidateQueries({ queryKey: ["score", address] });
        }
    }
  });
}


"use client";

import { Address } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";

import * as api from "./api";
import { Passport, PassportStatus } from "./types";
import { Context } from "./Provider";

export function usePassport() {
  return useContext(Context);
}

export function usePassportScore(address?: Address) {
  return useQuery<Passport | null, Error>({
    queryKey: ["score", address],
    queryFn: async () => {
      if (!address) return null;
      const r = await api.getScore(address as Address)
      if (r.status === PassportStatus.PROCESSING) {
        console.log("Retry until status is DONE or ERROR", r);
      }
      return r;
    },
    enabled: !!address, 
    retry: false, 
    refetchInterval: (data: Passport | null) => (data?.status === PassportStatus.PROCESSING ? 2000 : false),
  });
}

export function usePassportSubmit(address?: Address) {
  const client = useQueryClient();

  return useMutation<Passport, Error, void, unknown>({
    mutationFn: async (): Promise<Passport> => {
        if (!address) throw new Error("address not provided");
        return api.submitPassport(address as Address)
    },
    onSuccess: (data) => {
        // Trigger refetch of score
        client.invalidateQueries({ queryKey: ["score", address] });
        return data;
    }
  });
}

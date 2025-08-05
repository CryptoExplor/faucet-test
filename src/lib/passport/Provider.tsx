
"use client";

import { PropsWithChildren, createContext, useContext } from "react";
import { Address, useAccount } from "wagmi";
import {
  QueryClient,
  QueryClientProvider,
  UseQueryResult,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";

import type { Passport } from "./types";
import { usePassportScore, usePassportSubmit } from "./hooks";
import { PassportStatus } from "./types";

const ELIGIBILITY_THRESHOLD = 10;

type PassportContextType = {
  address?: Address;
  submit: UseMutationResult<Passport, Error, void, unknown>;
  score: UseQueryResult<Passport | null, Error>;
  isEligible: boolean;
  refresh: () => void;
};

export const Context = createContext<PassportContextType>({} as PassportContextType);

export const usePassport = () => useContext(Context);

function Provider({ children }: PropsWithChildren) {
  const { address } = useAccount();
  const score = usePassportScore(address);
  const submit = usePassportSubmit(address);
  const queryClient = useQueryClient();

  // Safer, more robust eligibility check as recommended
  const isEligible =
    score.data?.status === PassportStatus.DONE &&
    typeof score.data.score === 'number' &&
    score.data.score >= ELIGIBILITY_THRESHOLD;

  // Guarded refresh to prevent re-fetching while already loading
  const refresh = () => {
    if (address && !score.isFetching) {
      queryClient.invalidateQueries({ queryKey: ["score", address] });
    }
  };

  const value = {
    address,
    score,
    submit,
    isEligible,
    refresh,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

const queryClient = new QueryClient();

export function PassportProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>{children}</Provider>
    </QueryClientProvider>
  );
}

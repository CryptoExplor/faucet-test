
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

  const isEligible =
    score.data?.status === PassportStatus.DONE &&
    (score.data?.score ?? 0) >= ELIGIBILITY_THRESHOLD;

  const refresh = () => {
    if (address) {
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

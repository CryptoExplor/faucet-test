
"use client";

import { PropsWithChildren, createContext, useContext } from "react";
import { Address, useAccount } from "wagmi";
import {
  QueryClient,
  QueryClientProvider,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";

import type { Passport } from "./types";
import { usePassportScore, usePassportSubmit } from "./hooks";

type PassportContextType = {
  address?: Address;
  submit: UseMutationResult<Passport | null, Error, void, unknown>;
  score: UseQueryResult<Passport | null, Error>;
};

export const PassportContext = createContext<PassportContextType>({} as PassportContextType);

export const usePassport = () => useContext(PassportContext);

function Provider({ children }: PropsWithChildren) {
  const { address } = useAccount();
  const score = usePassportScore(address);
  const submit = usePassportSubmit(address);

  const value = {
    address,
    score,
    submit,
  } as PassportContextType;

  return <PassportContext.Provider value={value}>{children}</PassportContext.Provider>;
}

const queryClient = new QueryClient();

export function PassportProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>{children}</Provider>
    </QueryClientProvider>
  );
}

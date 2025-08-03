
"use client";

import { PropsWithChildren, createContext } from "react";
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
  submit: UseMutationResult<Passport, unknown, void, unknown>;
  score: UseQueryResult<Passport | null, Error>;
};

export const Context = createContext<PassportContextType>({} as PassportContextType);

function Provider({ children }: PropsWithChildren) {
  const { address } = useAccount();
  const score = usePassportScore(address);
  const submit = usePassportSubmit(address);

  const value = {
    address,
    score,
    submit,
  } as PassportContextType;

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

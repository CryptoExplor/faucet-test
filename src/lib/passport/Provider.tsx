"use client";

import { PropsWithChildren, createContext, useContext } from "react";
import { Address, useAccount } from "wagmi";
import {
  UseQueryResult,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";

import { Passport, PassportStatus } from "./types";
import { usePassportScore, usePassportSubmit } from "./hooks";

const ELIGIBILITY_THRESHOLD = 8;

type PassportContextType = {
  address?: Address;
  submit: UseMutationResult<Passport, Error, void, unknown>;
  score: UseQueryResult<Passport | null, Error>;
  isEligible: boolean;
  refresh: () => void;
};

export const Context = createContext<PassportContextType>({} as PassportContextType);

export const usePassport = () => useContext(Context);

export function PassportProvider({ children }: PropsWithChildren) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const score = usePassportScore(address);
  const submit = usePassportSubmit(address);

  const isEligible =
    score.data?.status === PassportStatus.DONE &&
    typeof score.data.score === 'number' &&
    score.data.score >= ELIGIBILITY_THRESHOLD;

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

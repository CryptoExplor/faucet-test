
"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { getScore, submitPassport } from "./api";

export const usePassportScore = (address?: Address) =>
  useQuery({
    queryKey: ["passport-score", address],
    queryFn: () => (address ? getScore(address) : null),
    enabled: !!address,
  });

export const usePassportSubmit = (address?: Address) =>
  useMutation({
    mutationFn: () => (address ? submitPassport(address) : Promise.resolve(null)),
  });


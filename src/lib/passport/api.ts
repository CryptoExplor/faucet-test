
import axios from "axios";
import { Passport } from "./types";
import { Address } from "viem";

const baseURL =
  process.env.NEXT_PUBLIC_GC_API_URL ||
  "https://api.scorer.gitcoin.co/registry";

const apiKey = process.env.NEXT_PUBLIC_GC_API_KEY;
if (!apiKey) {
    console.warn("NEXT_PUBLIC_GC_API_KEY is not set. Passport requests may fail.");
}

const api = axios.create({
  baseURL,
  headers: { common: { "x-api-key": apiKey } },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.warn("Gitcoin API request error", err);
    return Promise.reject(err.response?.data || err.message);
  }
);

const scorer_id = process.env.NEXT_PUBLIC_GC_SCORER_ID;
if (!scorer_id) {
    console.warn("NEXT_PUBLIC_GC_SCORER_ID is not set. Passport requests will fail.");
}

export const getScore = (address: Address) =>
  api.get<Passport>(`/score/${scorer_id}/${address}`).then((r) => r.data);

export const submitPassport = (address: Address) =>
  api
    .post<Passport>(`/submit-passport`, { address, scorer_id })
    .then((r) => r.data);

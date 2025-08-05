"use client";

import { QueryClient, type QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorBody.message || "An unknown error occurred");
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options?: {
  on401?: UnauthorizedBehavior;
}) => QueryFunction<T> =
  (options) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/"));

    if (options?.on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

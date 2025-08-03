
"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Network } from "@/lib/schema";
import { Settings, Shield, Activity, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertTitle } from "@/components/ui/alert";

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: networksData, isLoading: isLoadingNetworks } = useQuery<{networks: Network[]}>({
    queryKey: ["/api/networks", {all: 'true'}],
    // Refetch data to see any manual changes in the code
    staleTime: 1000 * 60 
  });
  const networks = networksData?.networks;

  const { data: stats, isLoading: isLoadingStats } = useQuery<{ totalClaims: number; uniqueClaimers: string; totalAmountClaimed: string }>({
    queryKey: ["/api/admin/stats"],
    staleTime: 1000 * 60
  });

  const isLoading = isLoadingNetworks || isLoadingStats;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary p-6 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-lg text-muted-foreground">Manage Superchain Faucet</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            The application is now using Upstash Redis for rate-limiting. Network configuration is managed statically in the code at <strong>src/lib/networks.ts</strong>. Editing networks via this dashboard is disabled. Claim statistics are no longer tracked.
          </AlertTitle>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Activity className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Networks</p>
                  <p className="text-2xl font-bold">
                    {networks?.filter(n => n.isActive).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Networks</p>
                  <p className="text-2xl font-bold">{networks?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Claims</p>
                  <p className="text-2xl font-bold">{stats?.totalClaims || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">ETH Distributed</p>
                  <p className="text-2xl font-bold">
                    {parseFloat(stats?.totalAmountClaimed || "0").toFixed(4)} ETH
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Network Management</span>
            </CardTitle>
            <CardDescription>
              Control network availability and faucet amounts for each Sepolia testnet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {networks?.map((network, index) => (
              <div key={network.id}>
                <div className="flex flex-wrap items-center justify-between p-4 bg-background rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <img 
                      src={network.iconUrl || '/networks/base.svg'} 
                      alt={network.name}
                      className="w-8 h-8"
                    />
                    <div>
                      <h3 className="font-semibold">
                        {network.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Chain ID: {network.chainId}
                      </p>
                    </div>
                    <Badge variant={network.isActive ? "default" : "destructive"}>
                      {network.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-muted-foreground">
                     {network.faucetAmount} {network.nativeCurrency}
                    </span>
                  </div>
                </div>
                 {index < networks.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Network } from "@/lib/schema";
import { Settings, Shield, Activity, TrendingUp, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingNetwork, setEditingNetwork] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ faucetAmount: string; isActive: boolean }>({
    faucetAmount: "",
    isActive: true,
  });

  const { data: networks, isLoading: isLoadingNetworks } = useQuery<Network[]>({
    queryKey: ["networks"],
    queryFn: async () => {
      const res = await fetch('/api/networks?all=true');
      if(!res.ok) throw new Error("Failed to fetch networks");
      const data = await res.json();
      return data.networks;
    }
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<{ totalClaims: number; uniqueClaimers: string; totalAmountClaimed: string }>({
    queryKey: ["admin-stats"],
     queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if(!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      return data;
    }
  });

  const updateNetworkMutation = useMutation({
    mutationFn: async ({ networkId, updates }: { networkId: string; updates: Partial<Network> }) => {
      const response = await fetch(`/api/admin/networks/${networkId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networks"] });
      setEditingNetwork(null);
      toast({
        title: "Success",
        description: "Network updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditNetwork = (network: Network) => {
    setEditingNetwork(network.id);
    setFormData({
      faucetAmount: network.faucetAmount,
      isActive: network.isActive,
    });
  };

  const handleSaveNetwork = (networkId: string) => {
    updateNetworkMutation.mutate({
      networkId,
      updates: formData,
    });
  };

  const handleCancelEdit = () => {
    setEditingNetwork(null);
    setFormData({ faucetAmount: "", isActive: true });
  };
  
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
          <p className="text-lg text-muted-foreground">Manage SepoliaDrop Faucet</p>
        </div>

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
              Control network availability and faucet amounts for each Sepolia testnet
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
                    {editingNetwork === network.id ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`amount-${network.id}`} className="text-sm">Amount:</Label>
                          <Input
                            id={`amount-${network.id}`}
                            value={formData.faucetAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, faucetAmount: e.target.value }))}
                            className="w-24 h-8"
                            placeholder="0.001"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`active-${network.id}`} className="text-sm">Active:</Label>
                          <Switch
                            id={`active-${network.id}`}
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                          />
                        </div>
                        <Button 
                          onClick={() => handleSaveNetwork(network.id)}
                          disabled={updateNetworkMutation.isPending}
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                        >
                          {updateNetworkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                          Save
                        </Button>
                        <Button 
                          onClick={handleCancelEdit}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-muted-foreground">
                         {network.faucetAmount} {network.nativeCurrency}
                        </span>
                        <Button 
                          onClick={() => handleEditNetwork(network)}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                      </div>
                    )}
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

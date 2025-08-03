
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Network } from "@/lib/schema";
import { Skeleton } from "./ui/skeleton";
import { Coins } from "lucide-react";

interface NetworkSelectorProps {
  selectedNetwork?: Network | null;
  onNetworkSelect: (network: Network | null) => void;
  className?: string;
}

export function NetworkSelector({ selectedNetwork, onNetworkSelect, className }: NetworkSelectorProps) {
  const { data: networkData, isLoading } = useQuery<{ networks: Network[] }>({
    queryKey: ["/api/networks"],
  });
  const networks = networkData?.networks || [];

  const handleNetworkChange = (networkId: string) => {
    const network = networks?.find(n => n.id === networkId);
    onNetworkSelect(network || null);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!networks || networks.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">No networks available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <span>Select Network</span>
        </CardTitle>
        <CardDescription>Choose a Sepolia testnet to receive funds on.</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedNetwork?.id || ""} onValueChange={handleNetworkChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a blockchain network..." />
          </SelectTrigger>
          <SelectContent>
            {networks.map((network) => (
              <SelectItem key={network.id} value={network.id}>
                <div className="flex items-center space-x-3">
                  <img 
                    src={network.iconUrl || '/networks/base.svg'} 
                    alt={network.name}
                    className="w-5 h-5"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{network.name}</span>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{network.faucetAmount} {network.nativeCurrency}</span>
                      <Badge variant="outline" className="px-1 py-0 text-xs">
                        ChainID: {network.chainId}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedNetwork && (
          <div className="mt-4 p-3 bg-secondary rounded-lg border">
            <div className="flex items-center space-x-3">
              <img 
                src={selectedNetwork.iconUrl || '/networks/base.svg'} 
                alt={selectedNetwork.name}
                className="w-6 h-6"
              />
              <div>
                <p className="font-medium text-foreground">{selectedNetwork.name}</p>
                <p className="text-sm text-muted-foreground">
                  You will receive {selectedNetwork.faucetAmount} {selectedNetwork.nativeCurrency} for this network.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

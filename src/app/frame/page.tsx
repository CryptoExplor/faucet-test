
"use client";

import { useState, useEffect } from "react";
import type { Metadata } from 'next';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wallet, Shield, Coins, ExternalLink, Clock, CheckCircle, Share, Info } from "lucide-react";
import { farcasterSDK, type FarcasterContext } from "@/components/farcaster-sdk";
import type { Network } from "@/lib/schema";

export const metadata: Metadata = {
  title: 'Superchain Faucet Frame',
  description: 'A Farcaster Frame for the Superchain Faucet',
  openGraph: {
    title: 'Superchain Faucet Frame',
    description: 'A Farcaster Frame for the Superchain Faucet',
    images: [`/frame-image.png`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `/frame-image.png`,
    'fc:frame:button:1': 'Open Mini App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': `/frame`,
  },
};


interface PassportData {
  score: number;
  isEligible: boolean;
}

interface RateLimitData {
  isRateLimited: boolean;
  remainingTime: number | null;
}

interface ClaimResponse {
  ok: boolean;
  txHash: string;
  network: Network;
  message?: string;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "0m";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function FarcasterFramePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [farcasterContext, setFarcasterContext] = useState<FarcasterContext | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [lastClaimNetwork, setLastClaimNetwork] = useState<Network | null>(null);


  // Use Base Sepolia as the default network for the frame
  const { data: networkData } = useQuery<{networks: Network[]}>({
    queryKey: ["/api/networks"],
  });
  const baseSepolia = networkData?.networks.find(n => n.chainId === 84532);


  // Initialize Farcaster SDK
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        await farcasterSDK.init();
        const context = await farcasterSDK.getContext();
        setFarcasterContext(context);
        
        const address = await farcasterSDK.getEthereumProvider();
        setWalletAddress(address);
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to Farcaster",
          variant: "destructive",
        });
      }
    };

    initFarcaster();
  }, [toast]);

  // Fetch Gitcoin Passport score
  const { data: passportData, isLoading: passportLoading, error: passportError } = useQuery<PassportData>({
    queryKey: ["/api/passport", walletAddress],
    enabled: !!walletAddress,
    queryFn: async () => {
        if (!walletAddress) throw new Error("Wallet address not available");
        const res = await fetch(`/api/passport/${walletAddress}`);
        if (!res.ok) throw new Error("Failed to fetch passport score");
        return res.json();
    },
    retry: false,
  });

  // Check rate limiting
  const { data: rateLimitData } = useQuery<RateLimitData>({
    queryKey: ["/api/rate-limit", walletAddress, baseSepolia?.id],
    enabled: !!walletAddress && !!baseSepolia,
    queryFn: async () => {
        if(!walletAddress || !baseSepolia) throw new Error("Missing params");
        const res = await fetch(`/api/rate-limit/${walletAddress}/${baseSepolia.id}`);
        if (!res.ok) throw new Error("Failed to check rate limit");
        return res.json();
    },
    refetchInterval: 30000,
  });

  // Claim tokens mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!walletAddress || !passportData || !baseSepolia) {
        throw new Error("Wallet, passport data, or network not available");
      }
      
      const response = await apiRequest("POST", "/api/claim", {
        address: walletAddress,
        chainId: baseSepolia.chainId,
        passportScore: passportData.score,
      });
      
      return response.json() as Promise<ClaimResponse>;
    },
    onSuccess: (data) => {
        if (data.ok && data.txHash) {
            setLastTxHash(data.txHash);
            setLastClaimNetwork(data.network);
            toast({
                title: "Transaction Successful!",
                description: `${data.network.faucetAmount} ETH sent to your wallet on ${data.network.name}`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/rate-limit", walletAddress, baseSepolia?.id] });
        } else {
             throw new Error(data.message || "Claim failed");
        }
    },
    onError: (error: any) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "An error occurred while processing your claim",
        variant: "destructive",
      });
    },
  });

  const openTransaction = (hash: string) => {
    const explorer = lastClaimNetwork?.explorerUrl || "https://sepolia.basescan.org";
    farcasterSDK.openUrl(`${explorer}/tx/${hash}`);
  };

  const shareSuccess = () => {
    const message = `Just claimed testnet ETH from the Superchain Faucet! 💧\n\nThanks to the builders for this public good for the Farcaster ecosystem.\n\nTx: ${lastTxHash?.slice(0, 10)}...`;
    farcasterSDK.composeCast(message, [window.location.origin]);
  };

  const isEligible = passportData && passportData.score >= 10;
  const canClaim = walletAddress && isEligible && !rateLimitData?.isRateLimited && !claimMutation.isPending;

  if (!farcasterContext) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Farcaster context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Coins className="text-primary-foreground text-lg" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-foreground">Superchain Faucet</h1>
                <p className="text-sm text-muted-foreground">Mini App for Farcaster</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <img 
                src={farcasterContext.user.pfpUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100.png';
                }}
              />
              <div>
                <p className="font-medium text-foreground">{farcasterContext.user.displayName}</p>
                <p className="text-sm text-muted-foreground">@{farcasterContext.user.username}</p>
              </div>
            </div>
            {walletAddress && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                <p className="font-mono text-sm text-foreground">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-foreground mb-3 flex items-center">
              <Shield className="text-primary mr-2 h-4 w-4" />
              Gitcoin Passport
            </h3>
            
            {passportLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                <span className="text-muted-foreground">Checking score...</span>
              </div>
            ) : passportError ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                 <p className="text-destructive text-sm">
                  No Passport found. Create one at passport.gitcoin.co
                </p>
              </div>
            ) : passportData ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-foreground">{passportData.score.toFixed(1)}</span>
                     <Badge variant={isEligible ? "default" : "destructive"}>
                      {isEligible ? "Eligible" : "Need 10+"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Score / 10 required</p>
                </div>
                <CheckCircle className={`h-8 w-8 ${isEligible ? "text-green-500" : "text-destructive"}`} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-foreground mb-3 flex items-center">
              <Coins className="text-accent mr-2 h-4 w-4" />
              Claim {baseSepolia?.faucetAmount || '0.001'} ETH on Base Sepolia
            </h3>

            {!isEligible ? (
              <Button disabled className="w-full">
                Need Gitcoin Passport Score ≥ 10
              </Button>
            ) : rateLimitData?.isRateLimited ? (
              <div>
                <Button disabled className="w-full">
                  <Clock className="mr-2 h-4 w-4" />
                  Rate Limited
                </Button>
                {rateLimitData.remainingTime && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                        Next claim in {formatTimeRemaining(rateLimitData.remainingTime)}
                    </p>
                )}
              </div>
            ) : claimMutation.isPending ? (
              <Button disabled className="w-full">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </Button>
            ) : (
              <Button 
                onClick={() => claimMutation.mutate()}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Coins className="mr-2 h-4 w-4" />
                Claim Test ETH
              </Button>
            )}

            <p className="text-xs text-muted-foreground mt-2 text-center">
              One claim per 24 hours • Base Sepolia Testnet
            </p>
          </CardContent>
        </Card>

        {lastTxHash && (
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="text-green-600 h-6 w-6" />
                </div>
                <h3 className="font-medium text-foreground mb-2">Success!</h3>
                <p className="text-sm text-muted-foreground mb-3">{baseSepolia?.faucetAmount} ETH sent to your wallet</p>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTransaction(lastTxHash)}
                    className="flex-1"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View Transaction
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareSuccess}
                    className="flex-1"
                  >
                    <Share className="mr-1 h-3 w-3" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="text-center text-xs text-muted-foreground py-4">
           <p>Built for the Superchain</p>
        </div>
      </div>
    </div>
  );
}


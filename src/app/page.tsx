
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import NextLink from "next/link";
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Send,
  ExternalLink,
  CheckCircle,
  Loader2,
  Copy,
  Info,
  Clock,
  Settings,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { claimTokens } from "./actions";
import type { Network } from "@/lib/schema";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAccount, useDisconnect } from "wagmi";
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { NetworkSelector } from "@/components/network-selector";
import { usePassport } from "@/lib/passport/Provider";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { PassportStatus } from "@/lib/passport/types";

const ELIGIBILITY_THRESHOLD = 8;

interface ClaimResult {
    success: boolean;
    txHash?: string;
    amount?: string;
    network?: string;
    explorerUrl?: string;
    error?: string;
}

function HomeComponent() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const { score: passportQuery, submit: passportSubmit, isEligible, refresh: refreshPassport } = usePassport();

  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  
  const { data: networkData } = useQuery<{ networks: Network[] }>({
    queryKey: ["/api/networks"],
  });
  const activeNetworks = networkData?.networks || [];

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!selectedNetwork && activeNetworks.length > 0) {
      const m = searchParams.get('m');
      if (m === 'i') {
        const sepoliaNetwork = activeNetworks.find(n => n.id === "sepolia");
        if (sepoliaNetwork) {
          setSelectedNetwork(sepoliaNetwork);
          return;
        }
      }
      setSelectedNetwork(activeNetworks[0]);
    }
  }, [selectedNetwork, activeNetworks, searchParams]);

  const handleDisconnectWallet = () => {
    disconnect();
    setClaimResult(null);
  };
  
  useEffect(() => {
    if (passportQuery.error) {
      toast({
        variant: "destructive",
        title: "Error fetching score",
        description: passportQuery.error.message || "Could not retrieve your Gitcoin Passport score.",
      });
    }
  }, [passportQuery.error, toast]);

  const handleClaim = async () => {
    if (!address || !selectedNetwork?.chainId || passportQuery.data?.score === undefined) return;
    setIsClaiming(true);
    setClaimResult(null);

    try {
      const scoreValue = passportQuery.data.score ?? 0;
      const result = await claimTokens(address, selectedNetwork.chainId, scoreValue);
      if (result.ok && result.txHash && result.network) {
        setClaimResult({
          success: true,
          txHash: result.txHash,
          amount: `${result.network.faucetAmount} ${result.network.nativeCurrency}`,
          network: result.network.name,
          explorerUrl: result.network.explorerUrl
        });
        toast({
            title: "Claim Successful!",
            description: `Sent ${result.network.faucetAmount} ${result.network.nativeCurrency} to your wallet.`,
        });
        await queryClient.invalidateQueries({ queryKey: ["rateLimit", address, selectedNetwork.id] });
        refreshPassport();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
        setClaimResult({ success: false, error: error.message || "An unknown error occurred." });
    } finally {
      setIsClaiming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const passportData = passportQuery.data;
  const passportScore = passportData?.score ?? 0;
  const canClaim = isConnected && isEligible && selectedNetwork && !isClaiming;

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-background shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Coins className="text-primary-foreground text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Superchain Faucet</h1>
                <p className="text-sm text-muted-foreground">A Multi-Chain Faucet for Sepolia Testnets</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NextLink href="/admin" className="hidden sm:flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </NextLink>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <Card className="shadow-lg">
               <CardHeader>
                 <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span>Wallet Connection</span>
                  </div>
                   {isConnected && (
                    <Badge variant="outline" className="border-green-500 bg-green-50 text-green-700">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                      Connected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <div>
                    <Button onClick={() => open()} disabled={isClaiming} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Connect Wallet
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Connect your wallet to check eligibility and claim test ETH
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-secondary rounded-lg p-3">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-medium text-muted-foreground">Wallet Address</span>
                         <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(address as string)}
                            className="text-primary hover:text-primary/90 h-auto p-1"
                          >
                           <Copy className="mr-1 h-3 w-3" />
                            Copy
                         </Button>
                       </div>
                       <p className="font-mono text-sm text-foreground break-all">{address}</p>
                     </div>

                    <Button variant="outline" onClick={handleDisconnectWallet} className="w-full">
                      Disconnect
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BadgeCheck className="h-5 w-5 text-primary" />
                        <span>Gitcoin Passport</span>
                    </CardTitle>
                  <CardDescription>A minimum score of {ELIGIBILITY_THRESHOLD} is required for claiming tokens.</CardDescription>
                </CardHeader>
                <CardContent>
                  {!isConnected ? (
                    <div className="text-center py-8">
                      <BadgeCheck className="text-muted-foreground/50 text-3xl mx-auto mb-3" />
                      <p className="text-muted-foreground">Connect your wallet to check your score</p>
                    </div>
                  ) : passportQuery.isLoading ? (
                    <div className="flex items-center justify-center gap-2 p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-muted-foreground">Verifying Passport...</span>
                    </div>
                  ) : passportQuery.isError ? (
                     <Alert variant="destructive">
                       <XCircle className="h-4 w-4" />
                       <AlertTitle>Error Verifying Passport</AlertTitle>
                       <AlertDescription>
                         {passportQuery.error.message}
                       </AlertDescription>
                     </Alert>
                  ) : !passportData ? (
                     <div className="text-center py-4">
                        <p className="text-muted-foreground mb-4">
                          Could not find a Gitcoin Passport for this address.
                        </p>
                        <Button onClick={() => passportSubmit.mutate()} disabled={passportSubmit.isPending}>
                            {passportSubmit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create/Refresh Passport
                        </Button>
                    </div>
                  ) : passportData.status === PassportStatus.PROCESSING ? (
                    <div className="flex items-center justify-center gap-2 p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-muted-foreground">Your score is processing...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-lg">
                        <span className="font-medium">Your Score:</span>
                        <Badge variant={isEligible ? "default" : "destructive"} className="bg-accent text-accent-foreground text-xl px-4 py-2">
                          {passportScore.toFixed(2)}
                        </Badge>
                      </div>
                      {isEligible ? (
                        <Alert className="border-green-500 bg-green-50 text-green-700">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <AlertDescription>
                            Congratulations! You are eligible to claim tokens.
                          </AlertDescription>
                        </Alert>
                      ) : (
                         <Alert variant="destructive">
                           <XCircle className="h-4 w-4" />
                           <AlertTitle>Not Eligible</AlertTitle>
                           <AlertDescription>
                             Your score is below the minimum threshold. Visit <a href="https://passport.gitcoin.co" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Gitcoin Passport</a> to improve your score.
                           </AlertDescription>
                         </Alert>
                      )}
                       <Button onClick={() => passportSubmit.mutate()} disabled={passportSubmit.isPending} size="sm" variant="outline" className="w-full">
                            {passportSubmit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Refresh Score
                        </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
        </div>
        <div className="space-y-6">
            <NetworkSelector 
              selectedNetwork={selectedNetwork} 
              onNetworkSelect={setSelectedNetwork}
            />

            <Card className="shadow-lg">
                <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-primary" />
                        <span>Claim Your Tokens</span>
                    </CardTitle>
                  <CardDescription>Select a network and receive Testnet ETH instantly.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleClaim} disabled={!canClaim} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-3 text-base">
                    {isClaiming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      `Claim ${selectedNetwork?.faucetAmount || ''} ${selectedNetwork?.nativeCurrency || ''}`
                    )}
                  </Button>
                </CardContent>
                 {claimResult && (
                  <CardFooter>
                     {claimResult.success ? (
                        <Alert className="w-full border-green-500 bg-green-50 text-green-700">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                           <AlertTitle className="text-green-800">Claim Successful!</AlertTitle>
                          <AlertDescription>
                           <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Amount:</span>
                                  <span className="font-mono">{claimResult.amount}</span>
                              </div>
                               <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Network:</span>
                                  <span className="font-medium">{claimResult.network}</span>
                              </div>
                              <Separator className="my-1 bg-green-200"/>
                               <a href={`${claimResult.explorerUrl}/tx/${claimResult.txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 pt-1 text-primary hover:underline">
                                  <span className="text-xs break-all">{claimResult.txHash}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive" className="w-full">
                           <XCircle className="h-4 w-4" />
                           <AlertTitle>Claim Failed</AlertTitle>
                           <AlertDescription>{claimResult.error}</AlertDescription>
                        </Alert>
                      )}
                  </CardFooter>
                )}
              </Card>
        </div>
      </main>

      <footer className="bg-background border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>© 2025 Superchain Faucet</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Powered by </span>
              <a href="https://farcaster.xyz/dare1.eth" target="_blank" rel="noopener noreferrer" aria-label="Farcaster" className="font-medium text-primary hover:underline">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M18.24 0.24H5.76C2.58 0.24 0 2.82 0 6V18C0 21.18 2.58 23.76 5.76 23.76H18.24C21.42 23.76 24 21.18 24 18V6C24 2.82 21.42 0.24 18.24 0.24ZM18 5.76V6C18 6.66 17.46 7.2 16.8 7.2H7.2C6.54 7.2 6 6.66 6 6V5.76C6 5.04 6.54 4.8 7.2 4.8H16.8C17.46 4.8 18 5.04 18 5.76ZM16.8 19.2H7.2C6.54 19.2 6 18.66 6 18V12C6 11.34 6.54 10.8 7.2 10.8H16.8C17.46 10.8 18 11.34 18 12V18C18 18.66 17.46 19.2 16.8 19.2Z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeComponent />
    </Suspense>
  );
}

export default Home;

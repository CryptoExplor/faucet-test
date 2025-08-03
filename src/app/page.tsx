
"use client";

import { useState, useEffect, useCallback } from "react";
import NextLink from "next/link";
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
import { getGitcoinPassportScore } from "@/ai/flows/gitcoin-passport-verification";
import { claimTokens } from "./actions";
import type { Network } from "@/lib/schema";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ethers, type BrowserProvider } from "ethers";
import { useQuery } from "@tanstack/react-query";
import { NetworkSelector } from "@/components/network-selector";

const ELIGIBILITY_THRESHOLD = 10;

interface ClaimResult {
    success: boolean;
    txHash?: string;
    amount?: string;
    network?: string;
    explorerUrl?: string;
    error?: string;
}

export default function Home() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [passportScore, setPassportScore] = useState<number | null>(null);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);

  const { toast } = useToast();

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        variant: "destructive",
        title: "MetaMask not found",
        description: "Please install MetaMask to use this app.",
      });
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        variant: "destructive",
        title: "Wallet Connection Failed",
        description: "Could not connect to your MetaMask wallet.",
      });
    }
  }, [toast]);

  const handleDisconnectWallet = () => {
    setAddress(null);
    setPassportScore(null);
    setSelectedNetwork(null);
    setClaimResult(null);
    setProvider(null);
  };

  const fetchScore = useCallback(async (walletAddress: string) => {
    setIsLoadingScore(true);
    setClaimResult(null);
    try {
      const result = await getGitcoinPassportScore({ address: walletAddress });
      setPassportScore(result.score);
      setIsEligible(result.isEligible && result.score >= ELIGIBILITY_THRESHOLD);
    } catch (error) {
      console.error("Error fetching Gitcoin Passport score:", error);
      toast({
        variant: "destructive",
        title: "Error fetching score",
        description: "Could not retrieve your Gitcoin Passport score.",
      });
      setPassportScore(0);
      setIsEligible(false);
    } finally {
      setIsLoadingScore(false);
    }
  }, [toast]);

  useEffect(() => {
    if (address) {
      fetchScore(address);
    }
  }, [address, fetchScore]);

  useEffect(() => {
    if(typeof window.ethereum === 'undefined') return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        handleDisconnectWallet();
      } else {
        setAddress(accounts[0]);
      }
    };

    window.ethereum?.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const handleClaim = async () => {
    if (!address || !selectedNetwork?.chainId || passportScore === null) return;
    setIsClaiming(true);
    setClaimResult(null);

    try {
      const result = await claimTokens(address, selectedNetwork.chainId, passportScore);
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
        // Refetch score to update rate limiting display implicitly
        if (address) fetchScore(address);
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

  const canClaim = isEligible && selectedNetwork && !isClaiming;
  const isConnected = !!address;

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
            {/* Wallet Connection */}
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
                    <Button onClick={connectWallet} disabled={isClaiming} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Connect MetaMask
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
                            onClick={() => copyToClipboard(address)}
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

            {/* Gitcoin Passport */}
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
                  ) : isLoadingScore ? (
                    <div className="flex items-center justify-center gap-2 p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-muted-foreground">Verifying Passport...</span>
                    </div>
                  ) : passportScore !== null ? (
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
                    </div>
                  ) : null}
                </CardContent>
              </Card>
        </div>
        <div className="space-y-6">
            <NetworkSelector selectedNetwork={selectedNetwork} onNetworkSelect={setSelectedNetwork} />

            {/* Faucet Claim */}
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
              <span>© 2024 Superchain Faucet</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Powered by </span>
              <NextLink href="https://superchain.com" target="_blank" className="font-medium text-primary hover:underline">Superchain</NextLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers, type BrowserProvider } from "ethers";
import {
  Wallet,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Send,
  ExternalLink,
  CheckCircle,
  Loader2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getGitcoinPassportScore } from "@/ai/flows/gitcoin-passport-verification";
import { claimTokens } from "./actions";
import type { Network } from "@/lib/schema";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";


const ELIGIBILITY_THRESHOLD = 10;

interface ClaimResult {
    success: boolean;
    txHash?: string;
    amount?: string;
    error?: string;
}

export default function Home() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [passportScore, setPassportScore] = useState<number | null>(null);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<string>("");
  const [isLoadingScore, setIsLoadingScore] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    async function fetchNetworks() {
        const res = await fetch('/api/networks');
        const data = await res.json();
        setNetworks(data.networks);
    }
    fetchNetworks();
  }, []);

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
    setSelectedChainId("");
    setClaimResult(null);
    setProvider(null);
  };

  const fetchScore = useCallback(async (walletAddress: string) => {
    setIsLoadingScore(true);
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
    if (!address || !selectedChainId) return;
    setIsClaiming(true);
    setClaimResult(null);

    try {
      const result = await claimTokens(address, parseInt(selectedChainId, 10));
      if (result.ok) {
        const selectedNetwork = networks.find(n => n.chainId === parseInt(selectedChainId));
        setClaimResult({
          success: true,
          txHash: result.txHash,
          amount: `${selectedNetwork?.faucetAmount} ETH`
        });

      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
        setClaimResult({ success: false, error: error.message || "An unknown error occurred." });
    } finally {
      setIsClaiming(false);
    }
  };

  const canClaim = isEligible && selectedChainId && !isClaiming;
  const isConnected = !!address;
  const selectedNetwork = networks.find(c => c.chainId === parseInt(selectedChainId));

  return (
    <main className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="max-w-md mx-auto space-y-6 w-full">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">SepoliaDrop</h1>
          <p className="text-muted-foreground">A Multi-Chain Faucet for the modern developer.</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span>Wallet Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <Button onClick={connectWallet} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Connect MetaMask
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-secondary rounded-md">
                  <span className="text-sm text-muted-foreground">Connected:</span>
                  <Badge variant="outline" className="border-primary text-primary">{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</Badge>
                </div>
                <Button variant="outline" onClick={handleDisconnectWallet} className="w-full">
                  Disconnect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isConnected && (
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5 text-primary" />
                    <span>Gitcoin Passport</span>
                </CardTitle>
              <CardDescription>A minimum score of {ELIGIBILITY_THRESHOLD} is required.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingScore ? (
                <div className="flex items-center justify-center gap-2 p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Verifying Passport...</span>
                </div>
              ) : passportScore !== null ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">Your Score:</span>
                    <Badge variant={isEligible ? "default" : "destructive"} className="text-xl px-4 py-2">
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
                      <AlertDescription>
                        Your score is below the minimum threshold.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {isConnected && isEligible && (
          <Card className="shadow-lg">
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    <span>Claim Your Tokens</span>
                </CardTitle>
              <CardDescription>Receive Testnet ETH on the network of your choice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Network</label>
                <Select value={selectedChainId} onValueChange={(value) => {setClaimResult(null); setSelectedChainId(value);}}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a network..." />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((chain) => (
                      <SelectItem key={chain.id} value={String(chain.chainId)}>
                        <div className="flex items-center space-x-2">
                          <span>{chain.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleClaim} disabled={!canClaim} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-3 text-base">
                {isClaiming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  `Claim ${selectedNetwork?.faucetAmount || ''} ETH`
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {claimResult && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {claimResult.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                <span className={claimResult.success ? "text-green-500" : "text-red-500"}>
                    {claimResult.success ? "Claim Successful!" : "Claim Failed"}
                </span>
              </CardTitle>
            </Header>
            <CardContent className="space-y-4 text-sm">
              {claimResult.success ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-mono">{claimResult.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network:</span>
                      <span className="font-medium">{selectedNetwork?.name}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Transaction:</span>
                     <a href={`${selectedNetwork?.explorerUrl}/tx/${claimResult.txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-muted rounded-md hover:bg-secondary transition-colors">
                      <code className="text-xs break-all text-primary">{claimResult.txHash}</code>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>{claimResult.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>This is a tool for developers to get testnet tokens for Sepolia-based networks.</p>
           <p>Rate-limited to one claim per network every 24 hours.</p>
        </div>
      </div>
    </main>
  );
}

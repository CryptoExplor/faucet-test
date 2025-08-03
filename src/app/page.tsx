"use client";

import { useState, useEffect, useCallback, type FC } from "react";
import { ethers, type BrowserProvider } from "ethers";
import {
  Wallet,
  Network,
  BadgeCheck,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Send,
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
import { chains } from "@/lib/chains";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const ELIGIBILITY_THRESHOLD = 10;

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number | null;
  isLoading: boolean;
  status?: "success" | "warning" | "default";
}

const StatusCard: FC<StatusCardProps> = ({ icon, title, value, isLoading, status = 'default' }) => {
  const statusClasses = {
    success: 'text-green-500',
    warning: 'text-amber-500',
    default: 'text-muted-foreground'
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {isLoading ? (
          <Skeleton className="h-5 w-24 mt-1" />
        ) : (
          <p className={`text-sm ${statusClasses[status]}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [passportScore, setPassportScore] = useState<number | null>(null);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [selectedChainId, setSelectedChainId] = useState<string>(String(chains[0].id));
  const [isLoadingScore, setIsLoadingScore] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
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
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setPassportScore(null);
        setIsEligible(false);
        setProvider(null);
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
    if (!address) return;
    setIsClaiming(true);
    try {
      const result = await claimTokens(address, parseInt(selectedChainId, 10));
      if (result.ok) {
        toast({
          title: "Claim Successful!",
          description: (
            <div>
              <p>0.01 Testnet ETH sent to your address.</p>
              <a 
                href={`${chains.find(c => c.id === parseInt(selectedChainId))?.explorerUrl}/tx/${result.txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Transaction <ChevronRight className="inline h-4 w-4" />
              </a>
            </div>
          ),
          action: <CheckCircle2 className="text-green-500" />,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Claiming failed:", error);
      toast({
        variant: "destructive",
        title: "Claim Failed",
        description: error.message || "An unknown error occurred.",
        action: <XCircle className="text-white" />,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const selectedNetwork = chains.find(c => c.id === parseInt(selectedChainId));

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl shadow-primary/10">
        <CardHeader>
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-primary/10 rounded-lg">
                <Send className="h-6 w-6 text-primary" />
             </div>
            <CardTitle className="text-2xl font-bold">SepoliaDrop</CardTitle>
          </div>
          <CardDescription>
            A multi-chain faucet for Sepolia testnets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!address ? (
            <Button onClick={connectWallet} className="w-full" size="lg">
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
          ) : (
            <div className="space-y-4">
              <StatusCard
                icon={<Wallet className="h-5 w-5 text-primary" />}
                title="Wallet Connected"
                value={`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
                isLoading={false}
              />
              <Separator />
              <StatusCard
                icon={<BadgeCheck className="h-5 w-5 text-primary" />}
                title="Gitcoin Passport Score"
                value={passportScore !== null ? passportScore : "N/A"}
                isLoading={isLoadingScore}
                status={isEligible ? 'success' : 'warning'}
              />
            </div>
          )}

          {address && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Network</label>
              <Select
                value={selectedChainId}
                onValueChange={setSelectedChainId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a network" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain) => (
                    <SelectItem key={chain.id} value={String(chain.id)}>
                      <div className="flex items-center space-x-2">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span>{chain.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
        {address && (
          <CardFooter>
            <Button
              onClick={handleClaim}
              disabled={!isEligible || isClaiming || isLoadingScore}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
              {isClaiming ? (
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isClaiming
                ? "Sending..."
                : !isEligible && passportScore !== null
                ? `Score too low (min ${ELIGIBILITY_THRESHOLD})`
                : "Claim 0.01 ETH"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}

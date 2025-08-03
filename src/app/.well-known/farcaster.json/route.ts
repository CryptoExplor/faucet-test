
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = "https://faucet-test-flax.vercel.app";

  const manifest = {
    name: "Superchain Faucet",
    version: "1",
    iconUrl: `${baseUrl}/icon.svg`,
    homeUrl: `${baseUrl}/`,
    splashImageUrl: `${baseUrl}/splash.svg`,
    splashBackgroundColor: "#F5EEFC",
    subtitle: "Faucet",
    description: "A multi-chain faucet for Sepolia testnets",
    primaryCategory: "utility",
    // Account association is required for the mini app to be official
    // You will need to generate these values and add them to your manifest
    // "accountAssociation": {
    //   "token": process.env.FARCASTER_ASSOCIATION_TOKEN,
    //   "signature": process.env.FARCASTER_ASSOCIATION_SIGNATURE
    // }
  };

  return NextResponse.json(manifest);
}

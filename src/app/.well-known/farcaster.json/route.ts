
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const host = req.nextUrl.host;
  const protocol = req.nextUrl.protocol;
  const baseUrl = `${protocol}//${host}`;

  const manifest = {
    name: "Superchain Faucet",
    version: "1",
    iconUrl: `${baseUrl}/icon.svg`,
    homeUrl: `${baseUrl}/frame`,
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

  return NextResponse.json({ frame: manifest });
}

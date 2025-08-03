
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const farcasterHostedManifestUrl = "https://api.farcaster.xyz/miniapps/hosted-manifest/01987153-3fe0-e658-7f1a-ae5b3fd62d86";
  
  // Return a temporary redirect to the Farcaster-hosted manifest URL
  return NextResponse.redirect(farcasterHostedManifestUrl, { status: 307 });
}

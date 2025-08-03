
import { NextRequest, NextResponse } from "next/server";

const FARCASTER_HOSTED_MANIFEST_URL = "https://api.farcaster.xyz/miniapps/hosted-manifest/01987153-3fe0-e658-7f1a-ae5b3fd62d86";

export async function GET(req: NextRequest) {
    // Redirect to the hosted manifest file
    return NextResponse.redirect(FARCASTER_HOSTED_MANIFEST_URL, { status: 307 });
}

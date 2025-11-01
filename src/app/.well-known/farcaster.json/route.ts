
import { NextRequest, NextResponse } from "next/server";

const FARCASTER_HOSTED_MANIFEST_URL = "https://api.farcaster.xyz/miniapps/hosted-manifest/019a3e80-9377-059d-a154-415fa065fa57";

export async function GET(req: NextRequest) {
    // Redirect to the hosted manifest file
    return NextResponse.redirect(FARCASTER_HOSTED_MANIFEST_URL, { status: 307 });
}

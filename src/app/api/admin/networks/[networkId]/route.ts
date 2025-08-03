
import { NextRequest, NextResponse } from "next/server";

// This endpoint is no longer functional as network data is managed statically.
// It is kept to prevent 404 errors from the admin page but will not perform any action.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { networkId: string } }
) {
  console.warn("Attempted to update network via API. Network data is now managed statically in src/lib/networks.ts");
  return NextResponse.json({ message: "Network management is disabled. Please update the configuration in the source code." }, { status: 400 });
}

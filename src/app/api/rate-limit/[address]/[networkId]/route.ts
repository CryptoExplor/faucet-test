
import { checkRateLimit } from "@/app/actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string; networkId: string } }
) {
  try {
    const { address, networkId } = params;
    const result = await checkRateLimit(address, networkId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to check rate limit:", error);
    return NextResponse.json(
      { message: "Failed to check rate limit", error: error.message },
      { status: 500 }
    );
  }
}

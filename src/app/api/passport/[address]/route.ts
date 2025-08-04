
import { getPassportScore } from "@/app/actions";
import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address || !isAddress(address)) {
      return NextResponse.json({ message: "A valid address is required" }, { status: 400 });
    }

    const result = await getPassportScore(address);
    const PASSPORT_THRESHOLD = 10;

    return NextResponse.json({
        address: address,
        score: result.score,
        passing_score: result.score >= PASSPORT_THRESHOLD,
        status: result.status,
        error: result.error,
    });

  } catch (error: any) {
    console.error("Failed to fetch passport score:", error);
    return NextResponse.json(
      { message: "Failed to fetch passport score", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  return GET(req, { params });
}

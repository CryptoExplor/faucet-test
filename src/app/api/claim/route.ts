
import { claimTokens } from "@/app/actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { address, chainId, passportScore } = await req.json();
    const result = await claimTokens(address, chainId, passportScore);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Claim failed:", error);
    return NextResponse.json(
      { ok: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}


import { getGitcoinPassportScore } from "@/ai/flows/gitcoin-passport-verification";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    if (!address) {
      return NextResponse.json({ message: "Address is required" }, { status: 400 });
    }
    const result = await getGitcoinPassportScore({ address });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to fetch passport score:", error);
    return NextResponse.json(
      { message: "Failed to fetch passport score", error: error.message },
      { status: 500 }
    );
  }
}

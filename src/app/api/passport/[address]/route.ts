
import { getPassportScore } from "@/app/actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    if (!address) {
      return NextResponse.json({ message: "Address is required" }, { status: 400 });
    }
    const result = await getPassportScore(address);
    return NextResponse.json(result);
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
  { params }: { params: Promise<{ address: string }> }
) {
  return GET(req, { params });
}

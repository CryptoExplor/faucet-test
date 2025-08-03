
import { getAdminStats } from "@/lib/networks";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json({ message: "Failed to fetch admin stats" }, { status: 500 });
  }
}

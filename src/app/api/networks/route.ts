
import { getActiveNetworks } from "@/lib/networks";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const networks = await getActiveNetworks();
    return NextResponse.json({ networks });
  } catch (error) {
    console.error("Failed to fetch networks:", error);
    return NextResponse.json({ error: "Failed to fetch networks" }, { status: 500 });
  }
}

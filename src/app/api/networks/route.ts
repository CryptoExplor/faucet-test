
import { getActiveNetworks, getAllNetworks } from "@/lib/networks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('all') === 'true';

    const networks = showAll ? await getAllNetworks() : await getActiveNetworks();
    
    return NextResponse.json({ networks });
  } catch (error) {
    console.error("Failed to fetch networks:", error);
    return NextResponse.json({ error: "Failed to fetch networks" }, { status: 500 });
  }
}

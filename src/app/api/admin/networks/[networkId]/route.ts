
import { updateNetwork } from "@/lib/networks";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  faucetAmount: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { networkId: string } }
) {
  const { networkId } = params;
  if (!networkId) {
    return NextResponse.json({ message: "Network ID is required" }, { status: 400 });
  }
  
  try {
    const body = await request.json();
    const validatedData = updateSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ message: "Invalid update data", errors: validatedData.error.errors }, { status: 400 });
    }

    const updatedNetwork = await updateNetwork(networkId, validatedData.data);

    if (!updatedNetwork) {
       return NextResponse.json({ message: "Network not found" }, { status: 404 });
    }

    return NextResponse.json(updatedNetwork);
  } catch (error: any) {
    console.error(`Failed to update network ${networkId}:`, error);
    return NextResponse.json({ message: error.message || "Failed to update network" }, { status: 500 });
  }
}

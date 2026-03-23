import { NextResponse } from "next/server";
import { getCostEstimatorOptions } from "@/lib/server/cost-estimator";

export async function POST(request: Request) {
  try {
    const { visitType, inNetwork = true } = await request.json();
    const options = await getCostEstimatorOptions(visitType, inNetwork);
    return NextResponse.json(options);
  } catch (error) {
    console.error("Error calculating cost estimate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

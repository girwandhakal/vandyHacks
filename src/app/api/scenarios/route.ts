import { NextResponse } from "next/server";
import { getSavedScenarios, getScenarioEstimate } from "@/lib/server/scenarios";

export async function GET() {
  try {
    const scenarios = await getSavedScenarios();
    return NextResponse.json(scenarios);
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { procedureType } = await request.json();
    const scenario = await getScenarioEstimate(procedureType);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario data unavailable" }, { status: 404 });
    }

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error("Error generating scenario:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

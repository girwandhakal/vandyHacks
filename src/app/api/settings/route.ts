import { NextResponse } from "next/server";
import { getSettingsData } from "@/lib/server/settings";

export async function GET() {
  try {
    const data = await getSettingsData();
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


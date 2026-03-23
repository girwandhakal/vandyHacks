import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/server/dashboard";

export async function GET() {
  try {
    const data = await getDashboardData();
    if (!data) {
      return NextResponse.json({ error: "Data missing" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

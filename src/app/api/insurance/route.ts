import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const plan = await prisma.insurancePlan.findFirst();

    if (!plan) {
      return NextResponse.json({ error: "Insurance plan not found" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching insurance plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const plan = await prisma.insurancePlan.findFirst();

    if (!plan) {
      return NextResponse.json({ error: "Insurance plan not found" }, { status: 404 });
    }
    
    const updatedPlan = await prisma.insurancePlan.update({
      where: { id: plan.id },
      data: body,
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Error updating insurance plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

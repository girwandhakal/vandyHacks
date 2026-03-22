import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HSA_BALANCE } from "@/lib/mock/connected-accounts";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    const plan = await prisma.insurancePlan.findFirst();

    if (!user || !plan) {
      return NextResponse.json({ error: "Data missing" }, { status: 404 });
    }

    // We get the upcoming reminders for the dashboard
    const upcomingReminders = await prisma.careReminder.findMany({
      where: { status: "upcoming" },
      take: 5,
    });

    const recentActivity = await prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const currentMonth = new Date().toLocaleString("default", { month: "long" });

    // Compute progress
    const deductiblePercent = Math.min(100, Math.round((plan.deductibleMetIndiv / plan.deductibleIndiv) * 100));
    const oopPercent = Math.min(100, Math.round((plan.oopSpentIndiv / plan.oopMaxIndiv) * 100));

    const aggregatedData = {
      greeting: `Welcome back, ${user.name}`,
      currentMonth,
      insurance: {
        ...plan,
        deductiblePercent,
        oopPercent,
      },
      financialSnapshot: {
        // Hardcoding HSA balance as it is not present in User/ConnectedAccount schemas explicitly yet
        hsaBalance: HSA_BALANCE,
        ytdSpending: plan.oopSpentIndiv,
      },
      upcomingReminders,
      recentActivity,
    };

    return NextResponse.json(aggregatedData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

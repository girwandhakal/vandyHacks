import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HSA_BALANCE } from "@/lib/mock/connected-accounts";

export async function GET() {
  try {
    const plan = await prisma.insurancePlan.findFirst();
    const reminders = await prisma.careReminder.findMany({ where: { status: "overdue" } });

    if (!plan) {
      return NextResponse.json({ error: "Insurance plan missing" }, { status: 404 });
    }

    const insights = [];

    const deductibleMetPercent = (plan.deductibleMetIndiv / plan.deductibleIndiv) * 100;
    if (deductibleMetPercent >= 100) {
      insights.push({
        id: "deductible-met",
        title: "Deductible Met",
        description: "You've met your deductible! Schedule any needed care before the end of the year to minimize out-of-pocket costs.",
        category: "timing",
        priority: "high",
        actionLabel: "Find Care",
        icon: "CheckCircle",
      });
    } else if (deductibleMetPercent > 80) {
      insights.push({
        id: "deductible-close",
        title: "Close to Deductible",
        description: `You are $${(plan.deductibleIndiv - plan.deductibleMetIndiv).toFixed(2)} away from meeting your deductible.`,
        category: "timing",
        priority: "medium",
        actionLabel: "View Details",
        icon: "Target",
      });
    }

    if (reminders.length > 0) {
      insights.push({
        id: "overdue-reminders",
        title: "Overdue Care",
        description: `You have ${reminders.length} overdue care reminder(s). Preventive care is often 100% covered!`,
        category: "action",
        priority: "high",
        actionLabel: "View Reminders",
        icon: "AlertCircle",
      });
    }

    const hsaBalance = HSA_BALANCE;
    if (hsaBalance > 2000) {
      insights.push({
        id: "hsa-savings",
        title: "Healthy HSA Balance",
        description: "Your HSA has a healthy balance. Consider investing a portion for long-term tax-free growth.",
        category: "savings",
        priority: "low",
        actionLabel: "Learn More",
        icon: "PiggyBank",
      });
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

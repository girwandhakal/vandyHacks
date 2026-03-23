import { cache } from "react";
import { HSA_BALANCE } from "@/lib/mock/connected-accounts";
import { prisma } from "@/lib/db";
import { getCurrentUser, getInsurancePlanRecord } from "@/lib/server/core";

export const getDashboardData = cache(async () => {
  const [user, plan, upcomingReminders, recentActivity] = await Promise.all([
    getCurrentUser(),
    getInsurancePlanRecord(),
    prisma.careReminder.findMany({
      where: { status: "upcoming" },
      take: 5,
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!user || !plan) {
    return null;
  }

  const deductiblePercent = Math.min(
    100,
    Math.round((plan.deductibleMetIndiv / plan.deductibleIndiv) * 100),
  );
  const oopPercent = Math.min(
    100,
    Math.round((plan.oopSpentIndiv / plan.oopMaxIndiv) * 100),
  );

  return {
    greeting: `Welcome back, ${user.name}`,
    currentMonth: new Date().toLocaleString("default", { month: "long" }),
    insurance: {
      ...plan,
      deductiblePercent,
      oopPercent,
    },
    financialSnapshot: {
      hsaBalance: HSA_BALANCE,
      ytdSpending: plan.oopSpentIndiv,
    },
    upcomingReminders,
    recentActivity,
  };
});

import { cache } from "react";
import { prisma } from "@/lib/db";
import { procedurePricing } from "@/lib/pricing";
import { HSA_BALANCE } from "@/lib/mock/connected-accounts";
import { DEFAULT_FINANCIAL_USER_ID } from "@/lib/plaid/default-user";
import { getInsurancePlanRecord } from "@/lib/server/core";

const DEFAULT_FINANCING_APR = 10;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateAmortizedPlan(principal: number, annualRatePercent: number, months: number) {
  if (principal <= 0 || months <= 0) {
    return { monthlyAmount: 0, totalCost: 0 };
  }

  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) {
    const monthlyAmount = roundMoney(principal / months);
    return {
      monthlyAmount,
      totalCost: roundMoney(monthlyAmount * months),
    };
  }

  const monthlyAmount = roundMoney(
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)),
  );

  return {
    monthlyAmount,
    totalCost: roundMoney(monthlyAmount * months),
  };
}

function getFinancialStrainLevel(monthlyImpactPercent: number): "low" | "moderate" | "high" {
  if (monthlyImpactPercent >= 10) return "high";
  if (monthlyImpactPercent >= 5) return "moderate";
  return "low";
}

export const getSavedScenarios = cache(async () =>
  prisma.scenario.findMany({
    orderBy: { createdAt: "desc" },
  }),
);

export const getScenarioEstimate = cache(async (procedureType: string) => {
  const plan = await getInsurancePlanRecord();
  if (!plan) {
    return null;
  }

  const procedure = procedurePricing.find((entry) => entry.name === procedureType);
  if (!procedure) {
    return null;
  }

  const baseCost = procedure.baseCost;
  const deductibleMetAssumption = 0;
  const oopSpentAssumption = 0;
  const remainingDeductible = Math.max(0, plan.deductibleIndiv - deductibleMetAssumption);
  const remainingOOP = Math.max(0, plan.oopMaxIndiv - oopSpentAssumption);
  const patientCoinsuranceRate = Math.max(0, 1 - plan.coinsuranceIn / 100);

  const deductibleApplied = Math.min(baseCost, remainingDeductible);
  const amountAfterDeductible = Math.max(0, baseCost - deductibleApplied);
  const coinsuranceApplied = amountAfterDeductible * patientCoinsuranceRate;

  const userResponsibility = Math.min(
    remainingOOP,
    deductibleApplied + coinsuranceApplied,
  );
  const insurancePortion = Math.max(0, baseCost - userResponsibility);

  const latestFinancialSnapshot = await prisma.financialProfileSnapshot.findFirst({
    where: { userId: DEFAULT_FINANCIAL_USER_ID },
    orderBy: { createdAt: "desc" },
    select: {
      monthlyIncomeEstimate: true,
      hsaBalance: true,
    },
  });

  const hsaAvailable =
    latestFinancialSnapshot?.hsaBalance &&
    Number.isFinite(latestFinancialSnapshot.hsaBalance) &&
    latestFinancialSnapshot.hsaBalance > 0
      ? latestFinancialSnapshot.hsaBalance
      : HSA_BALANCE;
  const monthlyIncome =
    latestFinancialSnapshot?.monthlyIncomeEstimate &&
    Number.isFinite(latestFinancialSnapshot.monthlyIncomeEstimate) &&
    latestFinancialSnapshot.monthlyIncomeEstimate > 0
      ? latestFinancialSnapshot.monthlyIncomeEstimate
      : 6000;

  const hsaRecommended = Math.min(hsaAvailable, userResponsibility);
  const sixMonthPlan = calculateAmortizedPlan(userResponsibility, DEFAULT_FINANCING_APR, 6);
  const twelveMonthPlan = calculateAmortizedPlan(userResponsibility, DEFAULT_FINANCING_APR, 12);
  const paymentScenarios = [
    {
      id: "ps-6",
      label: "6-Month Payment Plan",
      monthlyAmount: sixMonthPlan.monthlyAmount,
      totalCost: sixMonthPlan.totalCost,
      duration: "6 months",
      apr: DEFAULT_FINANCING_APR,
      description: "Spread the full estimated out-of-pocket amount over 6 months at a fixed 10% APR.",
    },
    {
      id: "ps-12",
      label: "12-Month Payment Plan",
      monthlyAmount: twelveMonthPlan.monthlyAmount,
      totalCost: twelveMonthPlan.totalCost,
      duration: "12 months",
      apr: DEFAULT_FINANCING_APR,
      description: "Lower the monthly bill by stretching the same balance across 12 months at a fixed 10% APR.",
    },
  ];
  const monthlyImpactPercent =
    monthlyIncome > 0 ? roundMoney((twelveMonthPlan.monthlyAmount / monthlyIncome) * 100) : 0;

  return {
    name: `${procedureType} Scenario`,
    procedureType,
    totalEstimatedCost: baseCost,
    insurancePortion,
    userResponsibility,
    hsaAvailable,
    hsaRecommended,
    paymentPlanMonths: 12,
    monthlyPayment: twelveMonthPlan.monthlyAmount,
    financingAPR: DEFAULT_FINANCING_APR,
    financingMonthly: sixMonthPlan.monthlyAmount,
    monthlyImpactPercent,
    financialStrainLevel: getFinancialStrainLevel(monthlyImpactPercent),
    paymentScenarios,
  };
});

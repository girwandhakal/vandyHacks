import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { procedurePricing } from "@/lib/pricing";

export async function GET() {
  try {
    const scenarios = await prisma.scenario.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(scenarios);
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { procedureType } = await request.json();
    const plan = await prisma.insurancePlan.findFirst();

    if (!plan) {
      return NextResponse.json({ error: "Insurance plan missing" }, { status: 404 });
    }

    const procedure = procedurePricing.find((p) => p.name === procedureType);
    if (!procedure) {
      return NextResponse.json({ error: "Procedure not found" }, { status: 404 });
    }

    const baseCost = procedure.baseCost;
    const remainingDeductible = plan.deductibleIndiv - plan.deductibleMetIndiv;
    const remainingOOP = plan.oopMaxIndiv - plan.oopSpentIndiv;
    const coinsuranceRate = plan.coinsuranceIn; 

    let userResponsibility = 0;
    
    if (remainingDeductible >= baseCost) {
      userResponsibility = baseCost;
    } else {
      userResponsibility = remainingDeductible;
      const costAfterDeductible = baseCost - remainingDeductible;
      userResponsibility += costAfterDeductible * (coinsuranceRate / 100);
    }

    if (userResponsibility > remainingOOP) {
      userResponsibility = remainingOOP;
    }

    const insurancePortion = baseCost - userResponsibility;

    const hsaAvailable = 3450.00;
    const hsaRecommended = Math.min(hsaAvailable, userResponsibility * 0.60);
    
    const monthlyIncome = 6000;
    const strainRatio = userResponsibility / monthlyIncome;
    let financialStrainLevel = "low";
    if (strainRatio > 0.5) financialStrainLevel = "high";
    else if (strainRatio > 0.15) financialStrainLevel = "moderate";

    const paymentPlanMonths = 12;
    const monthlyPayment = userResponsibility / paymentPlanMonths;
    const financingAPR = 8.5;
    const financingMonthly = (userResponsibility * (1 + (financingAPR / 100))) / paymentPlanMonths;

    const paymentScenarios = [
      { name: "HSA + Payment Plan", description: "Use HSA for 60%, finance the rest over 12 months", upfront: hsaRecommended, monthly: (userResponsibility - hsaRecommended) / 12 },
      { name: "Standard Payment Plan", description: "0% interest hospital payment plan over 12 months", upfront: 0, monthly: monthlyPayment },
      { name: "Medical Financing", description: "Third-party loan with 8.5% APR", upfront: 0, monthly: financingMonthly },
      { name: "Pay in Full", description: "Pay upfront in full", upfront: userResponsibility, monthly: 0 },
    ];

    const scenario = await prisma.scenario.create({
      data: {
        name: `${procedureType} Scenario`,
        procedureType,
        totalEstimatedCost: baseCost,
        insurancePortion,
        userResponsibility,
        hsaAvailable,
        hsaRecommended,
        paymentPlanMonths,
        monthlyPayment,
        financingAPR,
        financingMonthly,
        monthlyImpactPercent: (monthlyPayment / monthlyIncome) * 100,
        financialStrainLevel,
        paymentScenarios: JSON.stringify(paymentScenarios),
      },
    });

    return NextResponse.json(scenario);
  } catch (error) {
    console.error("Error generating scenario:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

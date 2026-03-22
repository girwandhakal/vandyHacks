import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { procedurePricing } from "@/lib/pricing";
import { generateFinancialScenario } from "@/lib/gemini";

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
    const remainingDeductible = Math.max(0, plan.deductibleIndiv - plan.deductibleMetIndiv);
    const remainingOOP = Math.max(0, plan.oopMaxIndiv - plan.oopSpentIndiv);
    const coinsuranceRate = plan.coinsuranceIn; 

    let userResponsibility = 0;
    
    if (remainingDeductible >= baseCost) {
      userResponsibility = baseCost;
    } else {
      userResponsibility = remainingDeductible;
      const costAfterDeductible = baseCost - remainingDeductible;
      userResponsibility += costAfterDeductible * ((100 - coinsuranceRate) / 100);
    }

    if (userResponsibility > remainingOOP) {
      userResponsibility = remainingOOP;
    }

    const insurancePortion = baseCost - userResponsibility;

    // Simulate real user financial context
    const hsaAvailable = 3450.00;
    const monthlyIncome = 6000;

    // --- WOW FACTOR: Connect to AI Financial Modeler ---
    const aiScenario = await generateFinancialScenario({
      procedureType,
      totalEstimatedCost: baseCost,
      userResponsibility,
      hsaAvailable,
      monthlyIncome
    });

    const scenario = await prisma.scenario.create({
      data: {
        name: `${procedureType} Scenario`,
        procedureType,
        totalEstimatedCost: baseCost,
        insurancePortion,
        userResponsibility,
        hsaAvailable,
        hsaRecommended: aiScenario.hsaRecommended,
        paymentPlanMonths: 12, // Baseline fallback representation
        monthlyPayment: aiScenario.paymentScenarios[0]?.monthlyAmount || 0,
        financingAPR: 8.5,
        financingMonthly: aiScenario.paymentScenarios[2]?.monthlyAmount || 0,
        monthlyImpactPercent: aiScenario.monthlyImpactPercent,
        financialStrainLevel: aiScenario.financialStrainLevel,
        paymentScenarios: JSON.stringify(aiScenario.paymentScenarios),
      },
    });

    return NextResponse.json({
      scenario: {
        ...scenario,
        paymentScenarios: JSON.parse(scenario.paymentScenarios)
      }
    });
  } catch (error) {
    console.error("Error generating scenario:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

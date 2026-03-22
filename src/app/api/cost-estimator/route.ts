import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { referencePricing, careSettingMeta } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const { visitType, inNetwork = true } = await request.json();
    const user = await prisma.user.findFirst();
    const plan = await prisma.insurancePlan.findFirst();

    if (!user || !plan) {
      return NextResponse.json({ error: "Data missing" }, { status: 404 });
    }

    const pricing = referencePricing.find((p) => p.visitType === visitType);
    if (!pricing) {
      return NextResponse.json({ error: "Pricing not found for visit type" }, { status: 404 });
    }

    const copays = JSON.parse(plan.copays || "{}");
    const coinsuranceRate = inNetwork ? plan.coinsuranceIn : plan.coinsuranceOut;
    const remainingDeductible = plan.deductibleIndiv - plan.deductibleMetIndiv;
    const remainingOOP = plan.oopMaxIndiv - plan.oopSpentIndiv;

    const options = Object.entries(pricing.settings).map(([settingKey, baseCost]) => {
      let userResponsibility = 0;
      let insurancePortion = 0;

      // Map setting key to copay key
      const copayMap: Record<string, number> = {
        primary_care: copays.primaryCare,
        specialist: copays.specialist,
        urgent_care: copays.urgentCare,
        emergency_room: copays.emergencyRoom,
        telehealth: copays.telehealth,
      };

      const copay = copayMap[settingKey] || 0;

      if (copay > 0 && baseCost > 0) {
        userResponsibility = copay;
        insurancePortion = Math.max(0, baseCost - copay);
      } else if (baseCost > 0) {
        let costAfterDeductible = 0;
        
        if (remainingDeductible >= baseCost) {
          userResponsibility = baseCost;
        } else {
          userResponsibility = remainingDeductible;
          costAfterDeductible = baseCost - remainingDeductible;
          const coinsuranceAmount = costAfterDeductible * (coinsuranceRate / 100);
          userResponsibility += coinsuranceAmount;
        }
        insurancePortion = baseCost - userResponsibility;
      }

      if (userResponsibility > remainingOOP) {
        insurancePortion += (userResponsibility - remainingOOP);
        userResponsibility = remainingOOP;
      }

      const meta = careSettingMeta[settingKey] || { label: settingKey, waitTime: "Unknown", bestFor: "General", icon: "Help" };

      return {
        setting: meta.label,
        settingKey,
        icon: meta.icon,
        baseCost,
        userResponsibility,
        insurancePortion,
        waitTime: meta.waitTime,
        bestFor: meta.bestFor,
        inNetwork,
      };
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("Error calculating cost estimate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

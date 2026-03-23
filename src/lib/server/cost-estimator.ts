import { cache } from "react";
import { referencePricing, careSettingMeta } from "@/lib/pricing";
import { getCurrentUser, getInsurancePlanRecord } from "@/lib/server/core";

export const getCostEstimatorOptions = cache(async (visitType: string, inNetwork = true) => {
  const [user, plan] = await Promise.all([getCurrentUser(), getInsurancePlanRecord()]);

  if (!user || !plan) {
    return [];
  }

  const pricing = referencePricing.find((entry) => entry.visitType === visitType);
  if (!pricing) {
    return [];
  }

  const copays = JSON.parse(plan.copays || "{}");
  const coinsuranceRate = inNetwork ? plan.coinsuranceIn : plan.coinsuranceOut;
  const remainingDeductible = Math.max(0, plan.deductibleIndiv - plan.deductibleMetIndiv);
  const remainingOOP = Math.max(0, plan.oopMaxIndiv - plan.oopSpentIndiv);

  return Object.entries(pricing.settings).map(([settingKey, baseCost]) => {
    let userResponsibility = 0;
    let insurancePortion = 0;

    const copayMap: Record<string, number> = {
      primary_care: copays.primaryCare,
      specialist: copays.specialist,
      urgent_care: copays.urgentCare,
      emergency_room: copays.emergencyRoom,
      telehealth: copays.telehealth,
    };

    const copay = inNetwork ? (copayMap[settingKey] || 0) : 0;

    if (copay > 0 && baseCost > 0) {
      userResponsibility = copay;
      insurancePortion = Math.max(0, baseCost - copay);
    } else if (baseCost > 0) {
      if (remainingDeductible >= baseCost) {
        userResponsibility = baseCost;
      } else {
        userResponsibility = remainingDeductible;
        const costAfterDeductible = baseCost - remainingDeductible;
        const userCoinsuranceAmount = costAfterDeductible * ((100 - coinsuranceRate) / 100);
        userResponsibility += userCoinsuranceAmount;
      }
      insurancePortion = baseCost - userResponsibility;
    }

    if (userResponsibility > remainingOOP) {
      insurancePortion += userResponsibility - remainingOOP;
      userResponsibility = remainingOOP;
    }

    const meta = careSettingMeta[settingKey] || {
      label: settingKey,
      waitTime: "Unknown",
      bestFor: "General",
      icon: "Help",
    };

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
});

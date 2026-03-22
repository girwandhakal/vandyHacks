import { InsurancePlan } from "@/types";

export const mockInsurancePlan: InsurancePlan = {
  id: "plan-001",
  name: "ISO Student Insurance",
  provider: "ISO Student Insurance",
  type: "PPO",
  planYear: { start: "2026-01-01", end: "2026-12-31" },
  deductible: { individual: 2000, family: 4000 },
  deductibleMet: { individual: 1340, family: 2100 },
  outOfPocketMax: { individual: 6500, family: 13000 },
  outOfPocketSpent: { individual: 2180, family: 3600 },
  coinsurance: { inNetwork: 80, outOfNetwork: 60 },
  copays: {
    primaryCare: 30,
    specialist: 50,
    urgentCare: 75,
    emergencyRoom: 250,
    telehealth: 15,
  },
  pharmacyBenefits: {
    generic: 10,
    preferred: 35,
    nonPreferred: 70,
    specialty: "30% after deductible",
    mailOrder: "2x copay for 90-day supply",
  },
  coverageRules: [
    "Preventive care covered at 100% in-network",
    "Referral not required for specialists",
    "Out-of-network care subject to balance billing",
    "Mental health parity with medical benefits",
    "Telehealth visits covered at in-network rates",
  ],
  exclusions: [
    "Cosmetic surgery (non-reconstructive)",
    "Experimental or investigational treatments",
    "Long-term custodial care",
    "Services not deemed medically necessary",
  ],
  priorAuthRequired: [
    "Inpatient hospital stays",
    "Advanced imaging (MRI, CT, PET)",
    "Outpatient surgery",
    "Specialty medications",
    "Durable medical equipment over $500",
  ],
};


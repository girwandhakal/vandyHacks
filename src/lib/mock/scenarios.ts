import { Scenario } from "@/types";

export const mockScenario: Scenario = {
  id: "scenario-001",
  name: "Knee Arthroscopy",
  procedureType: "Outpatient Surgery",
  totalEstimatedCost: 12500,
  insurancePortion: 9200,
  userResponsibility: 3300,
  hsaAvailable: 1850,
  hsaRecommended: 1850,
  paymentPlanMonths: 12,
  monthlyPayment: 290.12,
  financingAPR: 10,
  financingMonthly: 566.15,
  monthlyImpactPercent: 4.84,
  financialStrainLevel: "moderate",
  paymentScenarios: [
    {
      id: "ps-6",
      label: "6-Month Payment Plan",
      monthlyAmount: 566.15,
      totalCost: 3396.9,
      duration: "6 months",
      apr: 10,
      description: "Spread the full estimated out-of-pocket amount over 6 months at a fixed 10% APR.",
    },
    {
      id: "ps-12",
      label: "12-Month Payment Plan",
      monthlyAmount: 290.12,
      totalCost: 3481.44,
      duration: "12 months",
      apr: 10,
      description: "Lower the monthly bill by stretching the same balance across 12 months at a fixed 10% APR.",
    },
  ],
};

export const mockProcedures = [
  "Knee Arthroscopy",
  "Appendectomy",
  "Colonoscopy",
  "Cataract Surgery",
  "Hernia Repair",
  "Tonsillectomy",
  "Wisdom Teeth Removal",
  "ACL Reconstruction",
  "Childbirth (Vaginal)",
  "C-Section",
  "Hip Replacement",
  "Spinal Fusion",
];

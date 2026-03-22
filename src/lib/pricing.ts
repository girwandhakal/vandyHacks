// Reference pricing data for cost estimation engine
// Prices represent average billed amounts by care setting and visit type

export interface PricingEntry {
  visitType: string;
  settings: {
    telehealth: number;
    primary_care: number;
    urgent_care: number;
    emergency_room: number;
    specialist: number;
    hospital: number;
  };
}

export const referencePricing: PricingEntry[] = [
  {
    visitType: "General check-up",
    settings: { telehealth: 75, primary_care: 150, urgent_care: 250, emergency_room: 1500, specialist: 200, hospital: 2000 },
  },
  {
    visitType: "Flu / cold symptoms",
    settings: { telehealth: 65, primary_care: 130, urgent_care: 220, emergency_room: 1800, specialist: 180, hospital: 2200 },
  },
  {
    visitType: "Skin concern",
    settings: { telehealth: 80, primary_care: 160, urgent_care: 280, emergency_room: 1600, specialist: 250, hospital: 2000 },
  },
  {
    visitType: "Joint / muscle pain",
    settings: { telehealth: 85, primary_care: 185, urgent_care: 350, emergency_room: 2200, specialist: 300, hospital: 3500 },
  },
  {
    visitType: "Headache / migraine",
    settings: { telehealth: 70, primary_care: 140, urgent_care: 300, emergency_room: 2500, specialist: 280, hospital: 3000 },
  },
  {
    visitType: "Allergies",
    settings: { telehealth: 60, primary_care: 120, urgent_care: 200, emergency_room: 1200, specialist: 220, hospital: 1800 },
  },
  {
    visitType: "Minor injury",
    settings: { telehealth: 50, primary_care: 160, urgent_care: 320, emergency_room: 2800, specialist: 280, hospital: 4000 },
  },
  {
    visitType: "Mental health consultation",
    settings: { telehealth: 90, primary_care: 150, urgent_care: 200, emergency_room: 2000, specialist: 200, hospital: 3000 },
  },
  {
    visitType: "Lab work / blood test",
    settings: { telehealth: 0, primary_care: 200, urgent_care: 350, emergency_room: 1000, specialist: 250, hospital: 800 },
  },
  {
    visitType: "Imaging (X-ray, MRI)",
    settings: { telehealth: 0, primary_care: 300, urgent_care: 500, emergency_room: 1500, specialist: 800, hospital: 1200 },
  },
];

// Procedure costs for scenario modeling
export interface ProcedurePricing {
  name: string;
  baseCost: number;
  category: string;
}

export const procedurePricing: ProcedurePricing[] = [
  { name: "Knee Arthroscopy", baseCost: 12500, category: "Outpatient Surgery" },
  { name: "Appendectomy", baseCost: 18000, category: "Inpatient Surgery" },
  { name: "Colonoscopy", baseCost: 3500, category: "Outpatient Procedure" },
  { name: "Cataract Surgery", baseCost: 5000, category: "Outpatient Surgery" },
  { name: "Hernia Repair", baseCost: 11000, category: "Outpatient Surgery" },
  { name: "Tonsillectomy", baseCost: 8000, category: "Outpatient Surgery" },
  { name: "Wisdom Teeth Removal", baseCost: 3000, category: "Oral Surgery" },
  { name: "ACL Reconstruction", baseCost: 25000, category: "Inpatient Surgery" },
  { name: "Childbirth (Vaginal)", baseCost: 15000, category: "Inpatient" },
  { name: "C-Section", baseCost: 25000, category: "Inpatient Surgery" },
  { name: "Hip Replacement", baseCost: 35000, category: "Inpatient Surgery" },
  { name: "Spinal Fusion", baseCost: 80000, category: "Inpatient Surgery" },
];

// Care setting metadata
export const careSettingMeta: Record<string, { label: string; waitTime: string; bestFor: string; icon: string }> = {
  telehealth: {
    label: "Telehealth",
    waitTime: "< 1 hour",
    bestFor: "Low-acuity symptoms, follow-ups, prescription refills",
    icon: "Monitor",
  },
  primary_care: {
    label: "Primary Care",
    waitTime: "1-3 days",
    bestFor: "Ongoing concerns, referrals, preventive care",
    icon: "Stethoscope",
  },
  urgent_care: {
    label: "Urgent Care",
    waitTime: "30 min - 2 hours",
    bestFor: "After-hours needs, minor injuries, infections",
    icon: "Clock",
  },
  emergency_room: {
    label: "Emergency Room",
    waitTime: "1-6 hours",
    bestFor: "Life-threatening emergencies, severe symptoms",
    icon: "Siren",
  },
  specialist: {
    label: "Specialist",
    waitTime: "1-2 weeks",
    bestFor: "Targeted diagnosis, chronic condition management",
    icon: "Stethoscope",
  },
  hospital: {
    label: "Hospital",
    waitTime: "Varies",
    bestFor: "Inpatient procedures, complex diagnostics, surgery",
    icon: "Siren",
  },
};

// Visit types list (for dropdowns)
export const visitTypes = [
  "General check-up",
  "Flu / cold symptoms",
  "Skin concern",
  "Joint / muscle pain",
  "Headache / migraine",
  "Allergies",
  "Minor injury",
  "Mental health consultation",
  "Lab work / blood test",
  "Imaging (X-ray, MRI)",
];

// Procedure names list (for dropdowns)
export const procedureNames = procedurePricing.map((p) => p.name);

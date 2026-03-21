import { CareCompareOption } from "@/types";

export const mockCareOptions: CareCompareOption[] = [
  {
    setting: "telehealth",
    label: "Telehealth",
    estimatedCost: 85,
    insuranceCoverage: 70,
    outOfPocket: 15,
    waitTime: "< 1 hour",
    bestFor: "Low-acuity symptoms, follow-ups, prescription refills",
    icon: "Monitor",
  },
  {
    setting: "primary_care",
    label: "Primary Care",
    estimatedCost: 185,
    insuranceCoverage: 155,
    outOfPocket: 30,
    waitTime: "1-3 days",
    bestFor: "Ongoing concerns, referrals, preventive care",
    icon: "Stethoscope",
  },
  {
    setting: "urgent_care",
    label: "Urgent Care",
    estimatedCost: 350,
    insuranceCoverage: 275,
    outOfPocket: 75,
    waitTime: "30 min - 2 hours",
    bestFor: "After-hours needs, minor injuries, infections",
    icon: "Clock",
  },
  {
    setting: "emergency_room",
    label: "Emergency Room",
    estimatedCost: 2200,
    insuranceCoverage: 1950,
    outOfPocket: 250,
    waitTime: "1-6 hours",
    bestFor: "Life-threatening emergencies, severe symptoms",
    icon: "Siren",
  },
];

export const mockVisitTypes = [
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

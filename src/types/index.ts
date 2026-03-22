// Insurance plan and coverage types
export interface InsurancePlan {
  id: string;
  name: string;
  provider: string;
  type: "PPO" | "HMO" | "EPO" | "POS";
  planYear: { start: string; end: string };
  deductible: { individual: number; family: number };
  deductibleMet: { individual: number; family: number };
  outOfPocketMax: { individual: number; family: number };
  outOfPocketSpent: { individual: number; family: number };
  coinsurance: { inNetwork: number; outOfNetwork: number };
  copays: CopaySchedule;
  pharmacyBenefits: PharmacyBenefits;
  coverageRules: string[];
  exclusions: string[];
  priorAuthRequired: string[];
}

export interface CopaySchedule {
  primaryCare: number;
  specialist: number;
  urgentCare: number;
  emergencyRoom: number;
  telehealth: number;
}

export interface PharmacyBenefits {
  generic: number;
  preferred: number;
  nonPreferred: number;
  specialty: string;
  mailOrder: string;
}

// Cost estimation types
export interface CostEstimate {
  id: string;
  procedureName: string;
  careSetting: CareSetting;
  isInNetwork: boolean;
  billedAmount: { low: number; high: number; average: number };
  insurancePays: { low: number; high: number; average: number };
  outOfPocket: { low: number; high: number; average: number };
  assumptions: string[];
  confidenceLevel: "high" | "medium" | "low";
}

export type CareSetting = "telehealth" | "primary_care" | "urgent_care" | "emergency_room" | "specialist" | "hospital";

export interface CareCompareOption {
  setting: CareSetting;
  label: string;
  estimatedCost: number;
  insuranceCoverage: number;
  outOfPocket: number;
  waitTime: string;
  bestFor: string;
  icon: string;
}

// AI Assistant types
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  structuredResponse?: StructuredResponse;
  contextMeta?: AssistantContextMeta;
  timestamp: string;
}

export interface StructuredResponse {
  answer: string;
  situationSummary: string;
  billAssessment: string;
  insuranceAssessment: string;
  financialAssessment: string;
  recommendedStrategy: string;
  strategyOptions: StrategyOption[];
  immediateNextSteps: string[];
  documentsReferenced: ReferencedDocument[];
  assumptions: string[];
  missingInformation: string[];
  confidenceLevel: "high" | "medium" | "low";
  followUpQuestions: string[];
}

export interface StrategyOption {
  label: string;
  recommended: boolean;
  feasibility: "high" | "medium" | "low";
  monthlyCost: number;
  totalCost: number;
  pros: string[];
  cons: string[];
  requiredActions: string[];
  whyItFitsUser: string;
}

export interface ReferencedDocument {
  id: string;
  type: "insurance_plan" | "medical_bill" | "eob" | "estimate" | "financial_profile";
  label: string;
}

export interface AssistantContextMeta {
  intent?: string;
  referencedBillIds?: string[];
  referencedEobIds?: string[];
  tokenBudgetUsed?: number;
  truncated?: boolean;
  packetVersion?: string;
}

// Document types
export interface UploadedDocument {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  uploadedAt: string;
  fileSize: string;
  extractedData?: ExtractedBenefitSummary;
}

export type DocumentType = "insurance_plan" | "eob" | "medical_bill" | "estimate";
export type DocumentStatus = "uploading" | "analyzing" | "ready" | "error";

export interface ExtractedBenefitSummary {
  planName: string;
  deductible: number;
  outOfPocketMax: number;
  coverage: string;
}

// Scenario planner types
export interface Scenario {
  id: string;
  name: string;
  procedureType: string;
  totalEstimatedCost: number;
  insurancePortion: number;
  userResponsibility: number;
  hsaAvailable: number;
  hsaRecommended: number;
  paymentPlanMonths: number;
  monthlyPayment: number;
  financingAPR: number;
  financingMonthly: number;
  monthlyImpactPercent: number;
  financialStrainLevel: "low" | "moderate" | "high";
  paymentScenarios: PaymentScenario[];
}

export interface PaymentScenario {
  id: string;
  label: string;
  monthlyAmount: number;
  totalCost: number;
  duration: string;
  apr?: number;
  description: string;
}

// User / settings types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  connectedAccounts: ConnectedAccount[];
  preferences: UserPreferences;
}

export interface ConnectedAccount {
  id: string;
  type: "insurance" | "bank" | "hsa" | "fsa";
  label: string;
  status: "connected" | "disconnected" | "pending";
  lastSync?: string;
}

export interface UserPreferences {
  notifications: boolean;
  emailDigest: boolean;
  darkMode: boolean;
  currency: string;
}

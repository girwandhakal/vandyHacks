export type AssistantIntent =
  | "general_coverage_question"
  | "general_medical_bill_question"
  | "specific_bill_payment_question"
  | "bill_vs_eob_dispute_question"
  | "insurance_rule_question"
  | "financial_affordability_question"
  | "claim_denial_or_appeal_question"
  | "negotiation_tactics_question";

const PAYMENT_PATTERNS = [
  "pay off",
  "pay this bill",
  "how should i pay",
  "payment plan",
  "monthly payment",
  "installment",
  "loan",
  "financing",
];

const NEGOTIATION_PATTERNS = [
  "negotiate",
  "charity",
  "hardship",
  "financial assistance",
  "discount",
  "self-pay",
];

const DISPUTE_PATTERNS = [
  "eob",
  "explanation of benefits",
  "match my bill",
  "wrong bill",
  "appeal",
  "denied",
  "claim denied",
  "dispute",
];

const INSURANCE_PATTERNS = [
  "covered",
  "coverage",
  "deductible",
  "copay",
  "coinsurance",
  "out-of-pocket",
  "prior authorization",
  "in-network",
  "out-of-network",
];

const FINANCIAL_PATTERNS = [
  "afford",
  "affordable",
  "budget",
  "cash flow",
  "income",
  "hsa",
  "fsa",
  "free cash flow",
];

function hasPattern(input: string, patterns: string[]) {
  return patterns.some((pattern) => input.includes(pattern));
}

export function classifyAssistantIntent(message: string, explicitBillId?: boolean): AssistantIntent {
  const input = message.toLowerCase();

  if (hasPattern(input, DISPUTE_PATTERNS)) {
    if (input.includes("appeal") || input.includes("denied")) {
      return "claim_denial_or_appeal_question";
    }
    return "bill_vs_eob_dispute_question";
  }

  if (explicitBillId || hasPattern(input, PAYMENT_PATTERNS)) {
    return "specific_bill_payment_question";
  }

  if (hasPattern(input, NEGOTIATION_PATTERNS)) {
    return "negotiation_tactics_question";
  }

  if (hasPattern(input, FINANCIAL_PATTERNS)) {
    return "financial_affordability_question";
  }

  if (hasPattern(input, INSURANCE_PATTERNS)) {
    return "insurance_rule_question";
  }

  if (input.includes("bill") || input.includes("medical debt") || input.includes("statement")) {
    return "general_medical_bill_question";
  }

  return "general_coverage_question";
}

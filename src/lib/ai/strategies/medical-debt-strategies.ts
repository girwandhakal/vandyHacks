import { computeAffordabilityRisk } from "@/lib/plaid/analytics";

type MaybeNumber = number | null | undefined;

export interface FinancialSnapshotForStrategy {
  monthlyIncomeEstimate?: MaybeNumber;
  monthlyFixedCosts?: MaybeNumber;
  monthlyVariableCosts?: MaybeNumber;
  monthlyDebtPayments?: MaybeNumber;
  freeCashFlow?: MaybeNumber;
  checkingLiquidity?: MaybeNumber;
  hsaBalance?: MaybeNumber;
  fsaBalance?: MaybeNumber;
  savingsBuffer?: MaybeNumber;
  affordabilityRiskLevel?: string | null;
  availableMedicalPaymentCapacityNow?: MaybeNumber;
  availableMedicalPaymentCapacityMonthly?: MaybeNumber;
}

export interface InsuranceSnapshotForStrategy {
  deductibleMetIndiv?: MaybeNumber;
  deductibleIndiv?: MaybeNumber;
  oopSpentIndiv?: MaybeNumber;
  oopMaxIndiv?: MaybeNumber;
}

export interface MedicalBillForStrategy {
  id: string;
  providerName?: string | null;
  currentBalance?: MaybeNumber;
  patientResponsibility?: MaybeNumber;
  dueDate?: string | null;
  careType?: string | null;
  negotiationEligible?: boolean | null;
  charityCareEligible?: boolean | null;
  installmentPlanAvailable?: boolean | null;
  notesJson?: string | null;
}

export interface EobForStrategy {
  id?: string;
  patientResponsibility?: MaybeNumber;
  claimStatus?: string | null;
  denialReason?: string | null;
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
  score: number;
}

export interface StrategyComputationResult {
  recommendedPrimaryStrategy: string;
  options: StrategyOption[];
  financialSummary: string;
  billAssessment: string;
  insuranceAssessment: string;
  mismatchFlags: string[];
  confidence: "high" | "medium" | "low";
  scores: {
    payNowScore: number;
    installmentScore: number;
    negotiationScore: number;
    charityScore: number;
    loanScore: number;
    appealScore: number;
    useHsaScore: number;
  };
}

function num(value: MaybeNumber, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function monthsUntilDue(dueDate?: string | null) {
  if (!dueDate) return 1.5;
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return 1.5;
  const diff = (due - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  return Math.max(0, diff);
}

function buildAffordabilityRisk(profile: FinancialSnapshotForStrategy) {
  if (profile.affordabilityRiskLevel) {
    return profile.affordabilityRiskLevel;
  }

  return computeAffordabilityRisk({
    incomeEstimate: num(profile.monthlyIncomeEstimate),
    fixedCosts: num(profile.monthlyFixedCosts),
    variableCosts: num(profile.monthlyVariableCosts),
    debtPayments: num(profile.monthlyDebtPayments),
    savingsBuffer: num(profile.savingsBuffer, num(profile.checkingLiquidity)),
    medicalSpend: 0,
  });
}

function detectMismatchFlags(bill: MedicalBillForStrategy, eob?: EobForStrategy | null) {
  const flags: string[] = [];
  if (!eob) {
    flags.push("No linked EOB found yet.");
    return flags;
  }

  const billBalance = num(bill.patientResponsibility, num(bill.currentBalance));
  const eobResp = num(eob.patientResponsibility);
  if (eobResp > 0 && Math.abs(billBalance - eobResp) > 25) {
    flags.push("Bill balance does not closely match EOB patient responsibility.");
  }

  if (eob.claimStatus?.toLowerCase().includes("denied")) {
    flags.push("EOB indicates the claim was denied or not fully processed.");
  }

  return flags;
}

function buildFeasibility(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function buildMedicalDebtStrategies(params: {
  profile: FinancialSnapshotForStrategy;
  bill: MedicalBillForStrategy;
  eob?: EobForStrategy | null;
  insurance?: InsuranceSnapshotForStrategy | null;
}): StrategyComputationResult {
  const { profile, bill, eob, insurance } = params;
  const balance = Math.max(num(bill.currentBalance), num(bill.patientResponsibility));
  const payNowCapacity = num(
    profile.availableMedicalPaymentCapacityNow,
    num(profile.checkingLiquidity) + num(profile.hsaBalance) + num(profile.fsaBalance),
  );
  const monthlyCapacity = num(
    profile.availableMedicalPaymentCapacityMonthly,
    Math.max(0, num(profile.freeCashFlow, num(profile.monthlyIncomeEstimate) - num(profile.monthlyFixedCosts) - num(profile.monthlyVariableCosts) - num(profile.monthlyDebtPayments))),
  );
  const affordabilityRisk = buildAffordabilityRisk(profile);
  const dueInMonths = monthsUntilDue(bill.dueDate);
  const mismatchFlags = detectMismatchFlags(bill, eob);
  const notes = (bill.notesJson || "").toLowerCase();
  const canUseCharity = Boolean(bill.charityCareEligible) || notes.includes("charity") || notes.includes("financial assistance");
  const canUseInstallments = bill.installmentPlanAvailable !== false || notes.includes("payment plan");
  const canNegotiate = bill.negotiationEligible !== false || balance >= 500;
  const canUseHsa = num(profile.hsaBalance) + num(profile.fsaBalance) > 0;
  const highUrgency = dueInMonths < 0.75;

  const payNowScore = clamp(
    30 +
      (payNowCapacity >= balance ? 45 : payNowCapacity >= balance * 0.6 ? 15 : -25) +
      (affordabilityRisk === "low" ? 15 : affordabilityRisk === "medium" ? 5 : -20) +
      (highUrgency ? 5 : 0),
  );

  const installmentMonthly = balance > 0 ? balance / 12 : 0;
  const installmentScore = clamp(
    35 +
      (monthlyCapacity >= installmentMonthly ? 35 : monthlyCapacity >= installmentMonthly * 0.6 ? 10 : -15) +
      (canUseInstallments ? 20 : -15) +
      (affordabilityRisk === "high" || affordabilityRisk === "critical" ? 10 : 0),
  );

  const negotiationScore = clamp(
    25 +
      (canNegotiate ? 25 : -10) +
      (balance >= 1000 ? 20 : balance >= 300 ? 10 : 0) +
      (affordabilityRisk === "high" || affordabilityRisk === "critical" ? 20 : 0),
  );

  const charityScore = clamp(
    10 +
      (canUseCharity ? 30 : 0) +
      (affordabilityRisk === "critical" ? 40 : affordabilityRisk === "high" ? 25 : 0) +
      (balance > monthlyCapacity * 3 ? 15 : 0),
  );

  const appealScore = clamp(
    5 +
      (mismatchFlags.length > 0 ? 55 : 0) +
      (eob?.claimStatus?.toLowerCase().includes("denied") ? 20 : 0) +
      (eob?.denialReason ? 10 : 0),
  );

  const useHsaScore = clamp(
    20 +
      (canUseHsa ? 35 : -20) +
      (num(profile.hsaBalance) + num(profile.fsaBalance) >= balance ? 20 : 10) +
      (affordabilityRisk === "high" || affordabilityRisk === "critical" ? 10 : 0),
  );

  const loanScore = clamp(
    20 +
      (balance > 3000 ? 20 : 5) +
      (monthlyCapacity < installmentMonthly ? 10 : -10) +
      (affordabilityRisk === "critical" ? -35 : affordabilityRisk === "high" ? -20 : 0) +
      (appealScore > 40 || negotiationScore > 60 || charityScore > 60 ? -20 : 0),
  );

  const options: StrategyOption[] = [
    {
      label: "Use HSA/FSA funds first",
      recommended: false,
      feasibility: buildFeasibility(useHsaScore),
      monthlyCost: 0,
      totalCost: Math.min(balance, num(profile.hsaBalance) + num(profile.fsaBalance)),
      pros: ["Uses tax-advantaged dollars", "Reduces checking-account strain"],
      cons: [canUseHsa ? "May deplete funds set aside for future care" : "No HSA/FSA balance appears available"],
      requiredActions: ["Confirm the bill is valid and eligible", "Pay through the HSA/FSA portal or reimburse yourself"],
      whyItFitsUser: canUseHsa ? "The user appears to have tax-advantaged medical funds available." : "This only works if HSA or FSA funds are available.",
      score: useHsaScore,
    },
    {
      label: "Pay in full now",
      recommended: false,
      feasibility: buildFeasibility(payNowScore),
      monthlyCost: balance,
      totalCost: balance,
      pros: ["Ends the balance immediately", "Can preserve goodwill with the provider"],
      cons: ["Highest short-term cash hit", "May be premature if the bill should be disputed"],
      requiredActions: ["Verify bill/EOB alignment", "Ask for a prompt-pay discount before paying"],
      whyItFitsUser: payNowCapacity >= balance ? "Current liquidity appears sufficient for a full payment." : "Liquidity does not clearly support a full immediate payment.",
      score: payNowScore,
    },
    {
      label: "Ask for an interest-free payment plan",
      recommended: false,
      feasibility: buildFeasibility(installmentScore),
      monthlyCost: Math.round(installmentMonthly),
      totalCost: balance,
      pros: ["Spreads the cost across the year", "Usually better than financing if no interest is charged"],
      cons: ["Keeps the bill open longer", "Missed payments can still create collections risk"],
      requiredActions: ["Call the billing office", "Ask for 6-12 months interest-free", "Get the terms in writing"],
      whyItFitsUser: monthlyCapacity >= installmentMonthly ? "The estimated monthly cash flow can likely support installments." : "Installments are still safer than a lump sum even if the budget is tight.",
      score: installmentScore,
    },
    {
      label: "Negotiate the balance",
      recommended: false,
      feasibility: buildFeasibility(negotiationScore),
      monthlyCost: 0,
      totalCost: Math.round(balance * 0.85),
      pros: ["Can reduce the total owed", "Often works better before making payment"],
      cons: ["Not guaranteed", "Usually requires a call and persistence"],
      requiredActions: ["Request itemized charges", "Ask for a prompt-pay or hardship discount", "Ask if the provider will match the EOB patient responsibility"],
      whyItFitsUser: canNegotiate ? "The bill amount and affordability profile make negotiation worth trying first." : "Negotiation may still help, but the bill appears less obviously negotiable.",
      score: negotiationScore,
    },
    {
      label: "Apply for hardship or charity care",
      recommended: false,
      feasibility: buildFeasibility(charityScore),
      monthlyCost: 0,
      totalCost: Math.round(balance * 0.4),
      pros: ["May reduce the bill substantially", "Especially important for hospital and large facility balances"],
      cons: ["Requires paperwork and proof of income", "Eligibility depends on provider policy"],
      requiredActions: ["Ask for financial assistance forms", "Submit income documents", "Pause payment while the application is reviewed"],
      whyItFitsUser: canUseCharity ? "The bill or provider language suggests charity or hardship options may exist." : "Affordability risk is high enough that hardship screening is still worth checking.",
      score: charityScore,
    },
    {
      label: "Appeal or dispute before paying",
      recommended: false,
      feasibility: buildFeasibility(appealScore),
      monthlyCost: 0,
      totalCost: balance,
      pros: ["Prevents paying the wrong amount", "Can fix denied or mismatched claims"],
      cons: ["Takes time", "Requires records and follow-up"],
      requiredActions: ["Compare the bill to the EOB line by line", "Ask the provider to pause collections while reviewed", "File an appeal if the claim was denied"],
      whyItFitsUser: mismatchFlags.length > 0 ? "There are signs the bill should be validated before payment." : "This is lower priority unless the bill or EOB appears inconsistent.",
      score: appealScore,
    },
    {
      label: "Use medical financing or a loan last",
      recommended: false,
      feasibility: buildFeasibility(loanScore),
      monthlyCost: Math.round(balance / 24),
      totalCost: Math.round(balance * 1.12),
      pros: ["Can lower the monthly payment", "May buy time if other options fail"],
      cons: ["Usually increases total cost", "Risky when cash flow is already tight"],
      requiredActions: ["Only compare financing after negotiation and installment options", "Avoid high APR products", "Confirm no deferred-interest trap"],
      whyItFitsUser: loanScore >= 50 ? "Financing may be a fallback if no low-cost option is available." : "Higher-cost debt should stay behind negotiation, installments, HSA/FSA, and hardship options.",
      score: loanScore,
    },
  ];

  options.sort((a, b) => b.score - a.score);
  if (options[0]) {
    options[0].recommended = true;
  }

  const deductibleProgress =
    insurance && num(insurance.deductibleIndiv) > 0
      ? `${Math.round((num(insurance.deductibleMetIndiv) / Math.max(1, num(insurance.deductibleIndiv))) * 100)}% of the deductible is met`
      : "Deductible progress is not fully available";

  const billAssessment =
    mismatchFlags.length > 0
      ? `${bill.providerName || "This provider"} bill should be validated before payment. ${mismatchFlags.join(" ")}`
      : `${bill.providerName || "This provider"} has an estimated current balance of $${balance.toFixed(2)} with no obvious bill/EOB mismatch.`;

  const insuranceAssessment =
    eob
      ? `Linked EOB shows patient responsibility near $${num(eob.patientResponsibility).toFixed(2)}. ${deductibleProgress}.`
      : `No linked EOB is available yet. ${deductibleProgress}.`;

  const financialSummary = `Affordability risk is ${affordabilityRisk}. Estimated pay-now capacity is $${payNowCapacity.toFixed(2)} and sustainable monthly medical payment capacity is about $${monthlyCapacity.toFixed(2)}.`;

  return {
    recommendedPrimaryStrategy: options[0]?.label || "Validate the bill before paying",
    options,
    financialSummary,
    billAssessment,
    insuranceAssessment,
    mismatchFlags,
    confidence: mismatchFlags.length > 0 || !eob ? "medium" : "high",
    scores: {
      payNowScore,
      installmentScore,
      negotiationScore,
      charityScore,
      loanScore,
      appealScore,
      useHsaScore,
    },
  };
}

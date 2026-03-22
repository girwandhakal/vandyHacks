import { NormalizedCategory } from './normalization';

export interface FinancialProfileInput {
  incomeEstimate: number;
  fixedCosts: number;
  variableCosts: number;
  debtPayments: number;
  savingsBuffer: number;
  medicalSpend: number;
}

export function computeAffordabilityRisk(profile: FinancialProfileInput): 'low' | 'medium' | 'high' | 'critical' {
  const freeCashFlow = profile.incomeEstimate - profile.fixedCosts - profile.variableCosts - profile.debtPayments;

  if (profile.incomeEstimate <= 0) return 'critical';

  const dti = (profile.fixedCosts + profile.debtPayments) / profile.incomeEstimate;

  if (freeCashFlow < 0 || dti > 0.6) return 'critical';
  if (freeCashFlow < 200 || dti > 0.5) return 'high';
  if (freeCashFlow < 500 || dti > 0.4) return 'medium';

  return 'low';
}

export function canUserPayAmountNow(amount: number, profile: FinancialProfileInput): boolean {
  return profile.savingsBuffer >= amount || (profile.incomeEstimate - profile.fixedCosts - profile.variableCosts) > amount;
}

export function shouldSuggestNegotiation(amount: number, providerType: string, affordabilityRisk: string): boolean {
  if (amount > 1000) return true;
  if (affordabilityRisk === 'critical' || affordabilityRisk === 'high') return true;
  return false;
}

export function canUserPayAmountInInstallments(amount: number, months: number, profile: FinancialProfileInput): boolean {
  const monthlyPayment = amount / months;
  const freeCashFlow = profile.incomeEstimate - profile.fixedCosts - profile.variableCosts - profile.debtPayments;
  return freeCashFlow >= monthlyPayment;
}

export function buildAIContextSnapshot(profile: FinancialProfileInput, recentTransactions: any[], subscriptions: any[]) {
  const fcf = profile.incomeEstimate - profile.fixedCosts - profile.variableCosts - profile.debtPayments;
  return JSON.stringify({
    financial_health: {
      monthly_income: profile.incomeEstimate,
      free_cash_flow: fcf,
      affordability_risk: computeAffordabilityRisk(profile),
      savings_buffer: profile.savingsBuffer
    },
    cash_flow: {
      fixed_costs: profile.fixedCosts,
      variable_costs: profile.variableCosts,
      debt_payments: profile.debtPayments,
      medical_spend: profile.medicalSpend,
    },
    subscriptions: subscriptions,
    recent_transactions: recentTransactions.slice(0, 10), // Limit to top 10 for context length
    recommended_actions: []
  }, null, 2);
}

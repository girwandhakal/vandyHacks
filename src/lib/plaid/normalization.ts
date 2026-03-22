// Basic heuristics to categorize transactions
export type NormalizedCategory = 
  | 'INCOME'
  | 'RENT'
  | 'MORTGAGE'
  | 'UTILITIES'
  | 'GROCERIES'
  | 'DINING'
  | 'TRANSPORTATION'
  | 'INSURANCE'
  | 'DEBT_PAYMENT'
  | 'MEDICAL'
  | 'SUBSCRIPTION'
  | 'DISCRETIONARY'
  | 'CASH_WITHDRAWAL'
  | 'TRANSFER'
  | 'OTHER';

export function normalizeTransaction(
  name: string,
  amount: number,
  categories: string[] | null,
  paymentChannel: string | null
): {
  normalizedCategory: NormalizedCategory;
  cashflowDirection: 'inflow' | 'outflow';
  essentialityScore: 'essential' | 'discretionary' | 'wasteful' | 'unknown';
  recurringCandidate: boolean;
  merchantCanonical: string | null;
  confidence: 'high' | 'medium' | 'low';
} {
  const nameUpper = name.toUpperCase();
  const cats = categories || [];
  const catString = cats.join(',').toUpperCase();

  // Direction
  const isOutflow = amount >= 0; // Plaid conventionally returns positive amount for spending
  const cashflowDirection = isOutflow ? 'outflow' : 'inflow';
  const absAmount = Math.abs(amount);

  // Income heuristics
  if ((!isOutflow || nameUpper.includes('PAYROLL') || nameUpper.includes('DIR DEP') || nameUpper.includes('GUSTO') || nameUpper.includes('ADP') || nameUpper.includes('PAYCHECK')) && !nameUpper.includes('FEE')) {
    return {
      normalizedCategory: 'INCOME',
      cashflowDirection: 'inflow',
      essentialityScore: 'essential',
      recurringCandidate: true,
      merchantCanonical: name,
      confidence: 'high'
    };
  }

  // Transfers
  if (nameUpper.includes('TRANSFER') && nameUpper.includes('ONLINE')) {
    return {
      normalizedCategory: 'TRANSFER',
      cashflowDirection,
      essentialityScore: 'unknown',
      recurringCandidate: false,
      merchantCanonical: null,
      confidence: 'medium'
    };
  }

  // Medical
  if (catString.includes('HEALTHCARE') || catString.includes('MEDICAL') || nameUpper.includes('HOSPITAL') || nameUpper.includes('CLINIC') || nameUpper.includes('DR.')) {
    return {
      normalizedCategory: 'MEDICAL',
      cashflowDirection,
      essentialityScore: 'essential',
      recurringCandidate: false,
      merchantCanonical: name,
      confidence: 'medium'
    };
  }

  // Rent/Mortgage
  if ((nameUpper.includes('RENT') || nameUpper.includes('APARTMENTS') || nameUpper.includes('MORTGAGE')) && absAmount > 500) {
    return {
      normalizedCategory: nameUpper.includes('MORTGAGE') ? 'MORTGAGE' : 'RENT',
      cashflowDirection: 'outflow',
      essentialityScore: 'essential',
      recurringCandidate: true,
      merchantCanonical: name,
      confidence: 'medium'
    };
  }

  // Subscriptions
  if (nameUpper.includes('NETFLIX') || nameUpper.includes('HULU') || nameUpper.includes('SPOTIFY') || nameUpper.includes('AMAZON PRIME')) {
    return {
      normalizedCategory: 'SUBSCRIPTION',
      cashflowDirection: 'outflow',
      essentialityScore: 'discretionary',
      recurringCandidate: true,
      merchantCanonical: name,
      confidence: 'high'
    };
  }

  // Dining / Unnecessary
  if (catString.includes('RESTAURANT') || catString.includes('FOOD AND DRINK') || nameUpper.includes('DOORDASH') || nameUpper.includes('UBER EATS') || nameUpper.includes('STARBUCKS')) {
    return {
      normalizedCategory: 'DINING',
      cashflowDirection: 'outflow',
      essentialityScore: (nameUpper.includes('DOORDASH') || nameUpper.includes('UBER EATS')) ? 'wasteful' : 'discretionary',
      recurringCandidate: false,
      merchantCanonical: name,
      confidence: 'high'
    };
  }

  // Default fallback
  return {
    normalizedCategory: 'OTHER',
    cashflowDirection,
    essentialityScore: 'unknown',
    recurringCandidate: false,
    merchantCanonical: null,
    confidence: 'low'
  };
}

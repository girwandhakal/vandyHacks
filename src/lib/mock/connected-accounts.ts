export type AccountTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
};

export const FIXED_SYNC_DATE = new Date("2026-03-21T10:00:00Z");
export const HSA_BALANCE = 3450.0;

export function buildDummyTransactions(account: { id: string; type: string; label: string }): AccountTransaction[] {
  const fixedIso = FIXED_SYNC_DATE.toISOString();

  if (account.type === "insurance") {
    return [
      { id: `${account.id}-t1`, date: fixedIso, description: "Claim Adjustment", amount: -145.22, category: "claims" },
      { id: `${account.id}-t2`, date: fixedIso, description: "EOB Processed", amount: 0, category: "eob" },
      { id: `${account.id}-t3`, date: fixedIso, description: "Provider Payment", amount: -870.5, category: "coverage" },
    ];
  }

  if (account.type === "bank") {
    return [
      { id: `${account.id}-t1`, date: fixedIso, description: "Medical Bill Payment", amount: -92.35, category: "bill-pay" },
      { id: `${account.id}-t2`, date: fixedIso, description: "Prescription Purchase", amount: -24.99, category: "pharmacy" },
      { id: `${account.id}-t3`, date: fixedIso, description: "Payroll Deposit", amount: 2100, category: "income" },
    ];
  }

  if (account.type === "hsa") {
    return [
      { id: `${account.id}-t1`, date: fixedIso, description: "HSA Contribution", amount: 150, category: "contribution" },
      { id: `${account.id}-t2`, date: fixedIso, description: "Urgent Care Copay", amount: -40, category: "medical" },
      { id: `${account.id}-t3`, date: fixedIso, description: "Lab Test Payment", amount: -58.2, category: "medical" },
    ];
  }

  return [];
}

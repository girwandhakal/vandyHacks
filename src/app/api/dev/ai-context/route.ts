import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { buildAIContextSnapshot, FinancialProfileInput, computeAffordabilityRisk } from '@/lib/plaid/analytics';
import {
  DEFAULT_FINANCIAL_USER_ID,
  ensureDefaultFinancialUser,
  replaceFinancialContextSnapshots,
} from '@/lib/plaid/default-user';

const prisma = new PrismaClient();

function randomIntInclusive(min: number, max: number) {
  const lower = Math.ceil(min);
  const upper = Math.floor(max);
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const userId = DEFAULT_FINANCIAL_USER_ID;
    if (requestedUserId && requestedUserId !== DEFAULT_FINANCIAL_USER_ID) {
      console.log(`[AI-CONTEXT] Ignoring requested userId "${requestedUserId}" and using default user "${DEFAULT_FINANCIAL_USER_ID}".`);
    }
    await ensureDefaultFinancialUser(prisma);
    await replaceFinancialContextSnapshots(prisma, userId);
    
    // 1. Fetch normalized transactions for user
    const txns = await prisma.plaidTransactionNormalized.findMany({
      where: { userId },
      include: { rawTransaction: true },
      orderBy: { rawTransaction: { datePosted: 'desc' } }
    });
    const accounts = await prisma.plaidAccount.findMany({
      where: { userId }
    });

    // 2. Aggregate spending by category
    let incomeEstimate = 0;
    let fixedCosts = 0;
    let variableCosts = 0;
    let medicalSpend = 0;
    let debtPayments = 0;

    const subscriptions = [];

    for (const txn of txns) {
      const amount = txn.rawTransaction.amount;
      if (txn.normalizedCategory === 'INCOME') {
        incomeEstimate += Math.abs(amount);
      } else if (txn.normalizedCategory === 'RENT' || txn.normalizedCategory === 'MORTGAGE') {
        fixedCosts += Math.abs(amount);
      } else if (txn.normalizedCategory === 'MEDICAL') {
        medicalSpend += Math.abs(amount);
      } else if (txn.normalizedCategory === 'DEBT_PAYMENT') {
        debtPayments += Math.abs(amount);
      } else if (txn.normalizedCategory === 'SUBSCRIPTION') {
        fixedCosts += Math.abs(amount);
        subscriptions.push({ name: txn.rawTransaction.name, amount });
      } else {
        if (txn.essentialityScore === 'essential') fixedCosts += Math.abs(amount);
        else variableCosts += Math.abs(amount);
      }
    }

    // Average the totals over the time period of the transactions
    let monthsDiff = 1;
    if (txns.length > 1) {
       const newestDate = txns[0].rawTransaction.datePosted?.getTime() || Date.now();
       const oldestDate = txns[txns.length - 1].rawTransaction.datePosted?.getTime() || Date.now();
       monthsDiff = Math.max(1, (newestDate - oldestDate) / (1000 * 60 * 60 * 24 * 30));
    }

    const monthlyIncomeEstimate = incomeEstimate / monthsDiff;
    const monthlyFixedCosts = fixedCosts / monthsDiff;
    const monthlyVariableCosts = variableCosts / monthsDiff;
    const monthlyDebtPayments = debtPayments / monthsDiff;
    const monthlyMedicalSpend = medicalSpend / monthsDiff;
    const checkingLiquidity = accounts
      .filter(account => ['checking', 'savings'].includes((account.subtype || '').toLowerCase()))
      .reduce((sum, account) => sum + (account.availableBalance ?? account.currentBalance ?? 0), 0);
    const hsaBalance = accounts
      .filter(account => `${account.name} ${account.officialName || ''}`.toLowerCase().includes('hsa'))
      .reduce((sum, account) => sum + (account.availableBalance ?? account.currentBalance ?? 0), 0);
    const fsaBalance = accounts
      .filter(account => `${account.name} ${account.officialName || ''}`.toLowerCase().includes('fsa'))
      .reduce((sum, account) => sum + (account.availableBalance ?? account.currentBalance ?? 0), 0);
    const freeCashFlow = monthlyIncomeEstimate - monthlyFixedCosts - monthlyVariableCosts - monthlyDebtPayments;
    const randomSavingsMultiplier = randomIntInclusive(1, 12);
    const generatedSavingsBuffer = Math.round(Math.max(0, freeCashFlow) * randomSavingsMultiplier * 100) / 100;
    const actualSavingsBuffer = checkingLiquidity + hsaBalance + fsaBalance;
    const effectiveSavingsBuffer = actualSavingsBuffer > 0 ? actualSavingsBuffer : generatedSavingsBuffer;
    const effectiveCheckingLiquidity = checkingLiquidity > 0 ? checkingLiquidity : effectiveSavingsBuffer;

    const profile: FinancialProfileInput = {
      incomeEstimate: monthlyIncomeEstimate,
      fixedCosts: monthlyFixedCosts,
      variableCosts: monthlyVariableCosts,
      debtPayments: monthlyDebtPayments,
      medicalSpend: monthlyMedicalSpend,
      // When sandbox account balances are unavailable, synthesize a savings buffer from free cash flow.
      savingsBuffer: effectiveSavingsBuffer,
    };

    await prisma.financialProfileSnapshot.create({
      data: {
        userId,
        monthlyIncomeEstimate: profile.incomeEstimate,
        monthlyFixedCosts: profile.fixedCosts,
        monthlyVariableCosts: profile.variableCosts,
        monthlyMedicalSpend: profile.medicalSpend,
        monthlyDebtPayments: profile.debtPayments,
        freeCashFlow,
        checkingLiquidity: effectiveCheckingLiquidity,
        hsaBalance,
        fsaBalance,
        affordabilityRiskLevel: computeAffordabilityRisk(profile),
        availableMedicalPaymentCapacityNow: effectiveSavingsBuffer,
        availableMedicalPaymentCapacityMonthly: Math.max(0, freeCashFlow),
      }
    });

    const contextJsonStr = buildAIContextSnapshot(
      profile, 
      txns.map(t => ({ 
        name: t.rawTransaction.name, 
        amount: t.rawTransaction.amount, 
        date: t.rawTransaction.datePosted, 
        category: t.normalizedCategory 
      })),
      subscriptions
    );

    await prisma.aIContextSnapshot.create({
      data: {
        userId,
        contextJson: contextJsonStr,
        version: "v1"
      }
    });

    return NextResponse.json(JSON.parse(contextJsonStr));
  } catch (error: any) {
    console.error('Error generating context:', error.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

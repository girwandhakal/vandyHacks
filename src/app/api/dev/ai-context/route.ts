import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { buildAIContextSnapshot, FinancialProfileInput, computeAffordabilityRisk } from '@/lib/plaid/analytics';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) throw new Error('Missing userId');
    
    // 1. Fetch normalized transactions for user
    const txns = await prisma.plaidTransactionNormalized.findMany({
      where: { userId },
      include: { rawTransaction: true },
      orderBy: { rawTransaction: { datePosted: 'desc' } }
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

    const profile: FinancialProfileInput = {
      incomeEstimate: incomeEstimate / monthsDiff,
      fixedCosts: fixedCosts / monthsDiff,
      variableCosts: variableCosts / monthsDiff,
      debtPayments: debtPayments / monthsDiff,
      medicalSpend: medicalSpend / monthsDiff,
      savingsBuffer: 5000 // Fake buffer. Real app would calculate from PlaidAccounts
    };

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

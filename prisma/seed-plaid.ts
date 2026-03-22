import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Plaid Personas...');

  // Persona 1: Stable Salaried Worker
  const p1 = await prisma.user.upsert({
    where: { email: 'stable_worker@example.com' },
    update: {},
    create: { name: 'Stable Worker', email: 'stable_worker@example.com' }
  });

  await prisma.financialProfileSnapshot.create({
    data: {
      userId: p1.id,
      monthlyIncomeEstimate: 5000,
      monthlyFixedCosts: 1800,
      monthlyVariableCosts: 800,
      monthlyMedicalSpend: 50,
      monthlyDebtPayments: 300,
      monthlySubscriptions: 50,
      savingsRate: 0.20,
      freeCashFlow: 2000,
      emergencyBufferMonths: 3,
      housingStatus: 'rent',
      housingPaymentEstimate: 1400,
      affordabilityRiskLevel: 'low',
    }
  });

  // Persona 2: Financially Strained User
  const p2 = await prisma.user.upsert({
    where: { email: 'strained_user@example.com' },
    update: {},
    create: { name: 'Strained User', email: 'strained_user@example.com' }
  });

  await prisma.financialProfileSnapshot.create({
    data: {
      userId: p2.id,
      monthlyIncomeEstimate: 2500,
      monthlyFixedCosts: 1600,
      monthlyVariableCosts: 600,
      monthlyMedicalSpend: 0,
      monthlyDebtPayments: 400,
      monthlySubscriptions: 20,
      savingsRate: 0.0,
      freeCashFlow: -120,
      emergencyBufferMonths: 0,
      housingStatus: 'rent',
      housingPaymentEstimate: 1200,
      affordabilityRiskLevel: 'critical',
    }
  });

  // Persona 3: Wasteful Spender
  const p3 = await prisma.user.upsert({
    where: { email: 'wasteful_spender@example.com' },
    update: {},
    create: { name: 'Wasteful Spender', email: 'wasteful_spender@example.com' }
  });

  await prisma.financialProfileSnapshot.create({
    data: {
      userId: p3.id,
      monthlyIncomeEstimate: 9000,
      monthlyFixedCosts: 2500,
      monthlyVariableCosts: 4000,
      monthlyMedicalSpend: 0,
      monthlyDebtPayments: 1000,
      monthlySubscriptions: 400,
      savingsRate: 0.05,
      freeCashFlow: 1100,
      emergencyBufferMonths: 1,
      housingStatus: 'own',
      housingPaymentEstimate: 2000,
      affordabilityRiskLevel: 'medium',
    }
  });

  console.log('Seeded 3 personas successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

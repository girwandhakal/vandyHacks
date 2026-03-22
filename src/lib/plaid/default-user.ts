import type { PrismaClient } from "@prisma/client";

export const DEFAULT_FINANCIAL_USER_ID = "user-001";
export const DEFAULT_FINANCIAL_USER_NAME = "Alex Morgan";
export const DEFAULT_FINANCIAL_USER_EMAIL = "alex.morgan@email.com";

export async function ensureDefaultFinancialUser(prisma: PrismaClient) {
  return prisma.user.upsert({
    where: { id: DEFAULT_FINANCIAL_USER_ID },
    update: {
      name: DEFAULT_FINANCIAL_USER_NAME,
      email: DEFAULT_FINANCIAL_USER_EMAIL,
    },
    create: {
      id: DEFAULT_FINANCIAL_USER_ID,
      name: DEFAULT_FINANCIAL_USER_NAME,
      email: DEFAULT_FINANCIAL_USER_EMAIL,
    },
  });
}

export async function resetStoredFinancialData(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.aIContextSnapshot.deleteMany(),
    prisma.financialProfileSnapshot.deleteMany(),
    prisma.plaidTransactionNormalized.deleteMany(),
    prisma.plaidTransactionRaw.deleteMany(),
    prisma.plaidAccount.deleteMany(),
    prisma.plaidItem.deleteMany(),
  ]);
}

export async function replaceFinancialContextSnapshots(prisma: PrismaClient, userId: string) {
  await prisma.$transaction([
    prisma.aIContextSnapshot.deleteMany({ where: { userId } }),
    prisma.financialProfileSnapshot.deleteMany({ where: { userId } }),
  ]);
}

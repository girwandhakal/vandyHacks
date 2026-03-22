import type { PrismaClient } from "@prisma/client";
import { plaidClient } from "@/lib/plaid/client";

type PlaidItemForAccounts = {
  id: string;
  userId: string;
  accessTokenEncrypted: string;
};

export async function syncPlaidAccountsForItem(prisma: PrismaClient, item: PlaidItemForAccounts) {
  const response = await plaidClient.accountsGet({
    access_token: item.accessTokenEncrypted,
  });

  const accounts = response.data.accounts;
  const plaidAccountIds = accounts.map((account) => account.account_id);

  await prisma.$transaction([
    prisma.plaidAccount.deleteMany({
      where: {
        plaidItemId: item.id,
        plaidAccountId: { notIn: plaidAccountIds.length ? plaidAccountIds : ["__none__"] },
      },
    }),
    ...accounts.map((account) =>
      prisma.plaidAccount.upsert({
        where: { plaidAccountId: account.account_id },
        update: {
          userId: item.userId,
          plaidItemId: item.id,
          name: account.name,
          officialName: account.official_name || null,
          type: account.type,
          subtype: account.subtype || null,
          currentBalance: account.balances.current ?? null,
          availableBalance: account.balances.available ?? null,
          mask: account.mask || null,
          isoCurrencyCode: account.balances.iso_currency_code || null,
        },
        create: {
          userId: item.userId,
          plaidItemId: item.id,
          plaidAccountId: account.account_id,
          name: account.name,
          officialName: account.official_name || null,
          type: account.type,
          subtype: account.subtype || null,
          currentBalance: account.balances.current ?? null,
          availableBalance: account.balances.available ?? null,
          mask: account.mask || null,
          isoCurrencyCode: account.balances.iso_currency_code || null,
        },
      }),
    ),
  ]);
}

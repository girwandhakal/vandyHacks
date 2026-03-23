import { cache } from "react";
import { prisma } from "@/lib/db";
import { FIXED_SYNC_DATE, HSA_BALANCE } from "@/lib/mock/connected-accounts";
import { getCurrentUser } from "@/lib/server/core";

const DEFAULT_PREFERENCES = {
  notifications: true,
  emailDigest: false,
  darkMode: false,
  currency: "USD",
};

async function ensureConnectedAccounts(userId: string) {
  const current = await prisma.connectedAccount.findMany({ where: { userId } });
  const existingTypes = new Set(current.map((account) => account.type));

  const candidates = [
    { type: "insurance", label: "ISO Student Insurance", status: "connected" },
    { type: "bank", label: "Chase Checking ****4821", status: "connected" },
    { type: "hsa", label: "Fidelity HSA", status: "connected" },
  ];

  const missing = candidates.filter((candidate) => !existingTypes.has(candidate.type));

  if (missing.length > 0) {
    await prisma.connectedAccount.createMany({
      data: missing.map((candidate) => ({
        userId,
        type: candidate.type,
        label: candidate.label,
        status: candidate.status,
        lastSync: FIXED_SYNC_DATE,
      })),
    });
  }

  return prisma.connectedAccount.findMany({
    where: { userId, type: { in: ["insurance", "bank", "hsa"] } },
    orderBy: { lastSync: "desc" },
  });
}

function getAccountBalance(account: { type: string }) {
  if (account.type === "hsa") return HSA_BALANCE;
  if (account.type === "bank") return 8421.55;
  if (account.type === "insurance") return 0;
  return 0;
}

export const getSettingsData = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const connectedAccounts = await ensureConnectedAccounts(user.id);
  const preferences = {
    ...DEFAULT_PREFERENCES,
    ...JSON.parse(user.preferences || "{}"),
  };

  return {
    ...user,
    preferences,
    connectedAccounts: connectedAccounts.map((account) => ({
      ...account,
      balance: getAccountBalance(account),
    })),
  };
});

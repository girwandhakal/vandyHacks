import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FIXED_SYNC_DATE, HSA_BALANCE } from "@/lib/mock/connected-accounts";

async function ensureConnectedAccounts(userId: string) {
  await prisma.connectedAccount.deleteMany({
    where: { userId, type: "fsa" },
  });

  const current = await prisma.connectedAccount.findMany({ where: { userId } });
  const existingTypes = new Set(current.map((a) => a.type));

  const candidates = [
    { type: "insurance", label: "ISO Student Insurance", status: "connected" },
    { type: "bank", label: "Chase Checking ****4821", status: "connected" },
    { type: "hsa", label: "Fidelity HSA", status: "connected" },
  ];

  for (const c of candidates) {
    if (!existingTypes.has(c.type)) {
      await prisma.connectedAccount.create({
        data: { userId, type: c.type, label: c.label, status: c.status, lastSync: FIXED_SYNC_DATE },
      });
    }
  }

  await prisma.connectedAccount.updateMany({
    where: { userId, type: { in: ["insurance", "bank", "hsa"] } },
    data: { lastSync: FIXED_SYNC_DATE },
  });

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

export async function GET() {
  try {
    const user = await prisma.user.findFirst();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const connectedAccounts = await ensureConnectedAccounts(user.id);
    const preferences = {
      notifications: true,
      emailDigest: false,
      darkMode: false,
      currency: "USD",
      ...JSON.parse(user.preferences || "{}"),
    };

    const connectedAccountsWithBalance = connectedAccounts.map((account) => ({
      ...account,
      balance: getAccountBalance(account),
    }));

    return NextResponse.json({
      ...user,
      preferences,
      connectedAccounts: connectedAccountsWithBalance,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


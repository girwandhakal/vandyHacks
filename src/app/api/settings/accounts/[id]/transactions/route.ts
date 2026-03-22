import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildDummyTransactions } from "@/lib/mock/connected-accounts";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const account = await prisma.connectedAccount.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const transactions = buildDummyTransactions(account);
    return NextResponse.json({ accountId: account.id, transactions });
  } catch (error) {
    console.error("Error fetching account transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

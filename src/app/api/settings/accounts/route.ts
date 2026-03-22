import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FIXED_SYNC_DATE } from "@/lib/mock/connected-accounts";

export async function PUT(request: Request) {
  try {
    const { accountId, action } = await request.json();
    if (!accountId || (action !== "connect" && action !== "disconnect")) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const account = await prisma.connectedAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const updated = await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        status: action === "connect" ? "connected" : "disconnected",
        lastSync: action === "connect" ? FIXED_SYNC_DATE : account.lastSync,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating account status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

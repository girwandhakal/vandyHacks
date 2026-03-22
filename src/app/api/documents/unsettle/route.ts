import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { billId } = await request.json();

    if (!billId) {
      return NextResponse.json({ error: "Missing required billId" }, { status: 400 });
    }

    // Mark the primary bill as active again
    const updatedBill = await prisma.document.update({
      where: { id: billId },
      data: { isSettled: false } as any // Cast for temporal Prisma unsync
    });

    // Restore the connected EOB to active status
    const linkedEob = await prisma.document.findFirst({
       where: { linkedBillId: billId }
    });

    if (linkedEob) {
       await prisma.document.update({
          where: { id: linkedEob.id },
          data: { isSettled: false } as any
       });
    }

    return NextResponse.json({ success: true, document: updatedBill });
  } catch (error) {
    console.error("Error unsettling document:", error);
    return NextResponse.json({ error: "Failed to unsettle document claim" }, { status: 500 });
  }
}

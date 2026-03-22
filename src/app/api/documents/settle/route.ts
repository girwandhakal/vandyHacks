import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { billId } = await request.json();

    if (!billId) {
      return NextResponse.json({ error: "Missing required billId" }, { status: 400 });
    }

    // Mark the primary bill as settled
    const updatedBill = await prisma.document.update({
      where: { id: billId },
      data: { isSettled: true } // We will cast to any on the client if types aren't regenerated yet
    }) as any;

    // Check if there is an EOB linked to this bill, and if so, mark it settled as well so they archive together
    const linkedEob = await prisma.document.findFirst({
       where: { linkedBillId: billId }
    });

    if (linkedEob) {
       await prisma.document.update({
          where: { id: linkedEob.id },
          data: { isSettled: true }
       });
    }

    return NextResponse.json({ success: true, document: updatedBill });
  } catch (error) {
    console.error("Error settling document:", error);
    return NextResponse.json({ error: "Failed to settle document claim" }, { status: 500 });
  }
}

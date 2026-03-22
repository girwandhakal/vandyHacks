import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncDocumentModels } from "@/lib/ai/document-sync";

export async function POST(request: Request) {
  try {
    const { eobId, billId } = await request.json();

    if (!eobId || !billId) {
      return NextResponse.json({ error: "Missing required document IDs" }, { status: 400 });
    }

    // Bind the EOB to the specific Bill
    const updatedDocument = await prisma.document.update({
      where: { id: eobId },
      data: { linkedBillId: billId }
    });

    await syncDocumentModels(billId);
    await syncDocumentModels(eobId);

    return NextResponse.json({ success: true, document: updatedDocument });
  } catch (error) {
    console.error("Error linking documents:", error);
    return NextResponse.json({ error: "Failed to link documents" }, { status: 500 });
  }
}

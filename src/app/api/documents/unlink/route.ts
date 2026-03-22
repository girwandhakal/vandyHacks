import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { removeBillEobLinkForEobDocument } from "@/lib/ai/document-sync";

export async function POST(request: Request) {
  try {
    const { eobId } = await request.json();

    if (!eobId) {
      return NextResponse.json({ error: "Missing required eobId" }, { status: 400 });
    }

    // Sever the connection from the EOB to its Bill
    await removeBillEobLinkForEobDocument(eobId);
    const updatedDocument = await prisma.document.findUnique({
      where: { id: eobId },
    });

    return NextResponse.json({ success: true, document: updatedDocument });
  } catch (error) {
    console.error("Error unlinking documents:", error);
    return NextResponse.json({ error: "Failed to unlink documents" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";
import { recalculateFinancials } from "../utils";

export async function POST(request: Request) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: "Missing required documentId" }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Cascade deletion: if this is a Bill, also delete any attached EOBs so they don't become invisible ghosts
    if (doc.type === "medical_bill") {
       await prisma.document.deleteMany({
          where: { linkedBillId: documentId } as any
       });
    } 

    // Delete from Database
    await prisma.document.delete({
      where: { id: documentId }
    });

    await recalculateFinancials();

    // Attempt to physically delete the files to prevent bloat
    if (doc.filePath) {
      try {
        const relative = doc.filePath.replace(/^[/\\]+/, "");
        const docFile = path.join(process.cwd(), relative);
        if (fs.existsSync(docFile)) fs.unlinkSync(docFile);
        
        const txtFile = docFile + ".txt";
        if (fs.existsSync(txtFile)) fs.unlinkSync(txtFile);
      } catch (err) {
        console.error("Failed to delete physical files:", err);
      }
    }

    return NextResponse.json({ success: true, deletedId: documentId });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}


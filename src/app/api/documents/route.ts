import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeMedicalDocument } from "@/lib/gemini";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = (formData.get("type") as string) || "insurance_plan";
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, buffer);

    let fileText = "";
    let csvHint: string | null = null;
    console.log(`[DOC-UPLOAD] Starting processing for: ${file.name} (type: ${documentType}, size: ${file.size})`);
    
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      console.log(`[DOC-UPLOAD] File identified as PDF. Attempting to parse with pdf-parse-new SmartParser...`);
      try {
        // Use dynamic require to avoid Next.js Webpack ESM bundling errors
        const PdfParse = require("pdf-parse-new");
        const smartParser = new PdfParse.SmartPDFParser();
        const pdfResult = await smartParser.parse(buffer);
        fileText = pdfResult.text.substring(0, 15000);
        console.log(`[DOC-UPLOAD] Successfully extracted ${fileText.length} chars. Pages: ${pdfResult.numpages}, Method: ${pdfResult._meta?.method}`);
      } catch (err: any) {
        console.error("[DOC-UPLOAD-ERROR] PDF parse failed:", err.message);
        fileText = buffer.toString('utf-8').substring(0, 5000);
        console.log(`[DOC-UPLOAD] Fell back to raw binary substring.`);
      }
    } else {
      console.log(`[DOC-UPLOAD] File identified as CSV/Text. Extracting raw text...`);
      fileText = buffer.toString('utf-8').substring(0, 5000); 
      
      const firstLine = fileText.split('\n')[0].trim().toLowerCase();
      if (firstLine.includes("eob") || firstLine.includes("explanation of benefits")) {
         csvHint = "eob";
      } else if (firstLine.includes("medical bill")) {
         csvHint = "medical_bill";
      }
    }

    // Save a raw text cache alongside the PDF so the chat assistant can access it instantly
    try {
      if (fileText.length > 0) {
        fs.writeFileSync(filePath + ".txt", fileText);
        console.log(`[DOC-UPLOAD] Saved extracted text sidecar to ${filePath}.txt`);
      }
    } catch(e) {
      console.error("[DOC-UPLOAD-ERROR] Could not save text sidecar:", e);
    }

    // 1. Initially create the document neutrally
    const doc = await prisma.document.create({
      data: {
        name: file.name,
        type: documentType,
        status: "analyzing",
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        filePath: `/uploads/${fileName}`,
      },
    });

    console.log(`[DOC-UPLOAD] Sending extracted text to OpenAI for intelligent classification...`);
    // Run AI analysis asynchronously
    analyzeMedicalDocument(fileText, csvHint).then(async (aiResult) => {
      console.log(`[DOC-UPLOAD-AI] Received response from OpenAI! isValid: ${aiResult?.isValid}`);
      let finalStatus = "ready";
      let finalExtractedData = null;

      if (!aiResult || !aiResult.isValid || !aiResult.determinedType) {
        finalStatus = "error";
        finalExtractedData = JSON.stringify({ 
          rejectionReason: aiResult?.rejectionReason || "Could not validate or classify document type." 
        });
        
        await prisma.document.update({
          where: { id: doc.id },
          data: { status: finalStatus, extractedData: finalExtractedData }
        });
      } else {
        const finalType = aiResult.determinedType;
        finalExtractedData = JSON.stringify(aiResult.extractedData);
        
        // 2. Enforce the slot rule ONLY for insurance plans. Bills and EOBs can accumulate.
        if (finalType === "insurance_plan") {
          const existingDoc = await prisma.document.findFirst({ 
             where: { type: "insurance_plan", id: { not: doc.id } } 
          });
          if (existingDoc) {
            await prisma.document.delete({ where: { id: existingDoc.id } });
            try {
              const oldPdf = path.join(process.cwd(), existingDoc.filePath!);
              if (fs.existsSync(oldPdf)) fs.unlinkSync(oldPdf);
              if (fs.existsSync(oldPdf + ".txt")) fs.unlinkSync(oldPdf + ".txt");
            } catch(e) { console.error("Cleanup error:", e); }
          }
        }

        // Update dashboard (InsurancePlan) if valid insurance plan uploaded
        if (finalType === "insurance_plan" && aiResult.extractedData) {
          const firstPlan = await prisma.insurancePlan.findFirst();
          if (firstPlan) {
            const data = aiResult.extractedData;
            await prisma.insurancePlan.update({
              where: { id: firstPlan.id },
              data: {
                name: data.planName || firstPlan.name,
                provider: data.network || firstPlan.provider,
                deductibleIndiv: data.deductibleIndiv ?? firstPlan.deductibleIndiv,
                deductibleFamily: data.deductibleFamily ?? firstPlan.deductibleFamily,
                oopMaxIndiv: data.oopMaxIndiv ?? firstPlan.oopMaxIndiv,
                oopMaxFamily: data.oopMaxFamily ?? firstPlan.oopMaxFamily,
                coinsuranceIn: data.coinsuranceIn ?? firstPlan.coinsuranceIn,
                coinsuranceOut: data.coinsuranceOut ?? firstPlan.coinsuranceOut,
                
                // Deep Structured Extraction Fields
                copays: data.copays ? JSON.stringify(data.copays) : firstPlan.copays,
                pharmacyBenefits: data.pharmacyBenefits ? JSON.stringify(data.pharmacyBenefits) : firstPlan.pharmacyBenefits,
                coverageRules: data.coverageRules ? JSON.stringify(data.coverageRules) : firstPlan.coverageRules,
                exclusions: data.exclusions ? JSON.stringify(data.exclusions) : firstPlan.exclusions,
                priorAuthRequired: data.priorAuthRequired ? JSON.stringify(data.priorAuthRequired) : firstPlan.priorAuthRequired,
              }
            });
          }
        }

        // 3. Mark the document as ready and assign its new discovered type
        await prisma.document.update({
          where: { id: doc.id },
          data: { 
            type: finalType,
            status: finalStatus, 
            extractedData: finalExtractedData 
          }
        });
      }
    }).catch(console.error);

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

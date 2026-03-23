import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeMedicalDocument } from "@/lib/gemini";
import { syncDocumentModels } from "@/lib/ai/document-sync";
import { getDocuments } from "@/lib/server/documents";
import fs from "fs";
import path from "path";

function loadPdfParseNew() {
  const runtimeRequire = eval("require") as NodeRequire;
  return runtimeRequire("pdf-parse-new");
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/-?\d+(\.\d+)?/);
    if (match) {
      const parsed = Number(match[0]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function firstPositive(...values: unknown[]): number {
  for (const value of values) {
    const numeric = toNumber(value, 0);
    if (numeric > 0) return numeric;
  }
  return 0;
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseDelimitedTable(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headerIndex = lines.findIndex((line) => line.includes(","));
  if (headerIndex < 0 || headerIndex + 1 >= lines.length) return null;

  const headers = splitCsvLine(lines[headerIndex]).map(normalizeHeader);
  const rows = lines.slice(headerIndex + 1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });

    return row;
  });

  return { headers, rows };
}

function csvValue(row: Record<string, string>, ...headerOptions: string[]) {
  for (const option of headerOptions) {
    const normalized = normalizeHeader(option);
    if (row[normalized]) return row[normalized];
  }
  return "";
}

function parseMedicalBillCsv(text: string) {
  const table = parseDelimitedTable(text);
  if (!table || !table.rows.length) return null;

  const rows = table.rows;
  const firstRow = rows[0];
  const lineItems = rows.map((row) => {
    const amount = toNumber(
      csvValue(row, "Amount Owed", "Patient Responsibility", "Current Balance", "Total Charged"),
    );

    return {
      description: csvValue(row, "Description"),
      procedureCode: csvValue(row, "Procedure Code"),
      amount,
    };
  });

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const currentBalance = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const patientResponsibility = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return {
    providerName: csvValue(firstRow, "Provider"),
    patientName: csvValue(firstRow, "Patient Name"),
    dateOfService: csvValue(firstRow, "Date of Service"),
    dateOfServiceStart: csvValue(firstRow, "Date of Service"),
    dateOfServiceEnd: csvValue(firstRow, "Date of Service"),
    totalAmount,
    currentBalance,
    patientResponsibility,
    lineItems,
    sourceExcerpts: rows.slice(0, 3).map((row) =>
      [
        csvValue(row, "Provider"),
        csvValue(row, "Description"),
        csvValue(row, "Procedure Code"),
        csvValue(row, "Total Charged", "Amount Owed", "Patient Responsibility"),
      ]
        .filter(Boolean)
        .join(" | "),
    ),
  };
}

function parseEobCsv(text: string) {
  const table = parseDelimitedTable(text);
  if (!table || !table.rows.length) return null;

  const firstRow = table.rows[0];
  return {
    patientName: csvValue(firstRow, "Patient Name"),
    providerName: csvValue(firstRow, "Provider"),
    dateOfService: csvValue(firstRow, "Date of Service"),
    dateOfServiceStart: csvValue(firstRow, "Date of Service"),
    dateOfServiceEnd: csvValue(firstRow, "Date of Service"),
    billedAmount: toNumber(csvValue(firstRow, "Billed Amount")),
    allowedAmount: toNumber(csvValue(firstRow, "Allowed Amount")),
    planPaidAmount: toNumber(csvValue(firstRow, "Plan Paid", "Plan Paid Amount")),
    patientResponsibility: toNumber(csvValue(firstRow, "Patient Responsibility", "Amount You Owe")),
    sourceExcerpts: [
      [
        csvValue(firstRow, "Provider"),
        csvValue(firstRow, "Billed Amount"),
        csvValue(firstRow, "Allowed Amount"),
        csvValue(firstRow, "Plan Paid", "Plan Paid Amount"),
        csvValue(firstRow, "Patient Responsibility", "Amount You Owe"),
      ]
        .filter(Boolean)
        .join(" | "),
    ],
  };
}

function mergeCsvExtractedData(finalType: string, aiData: any, rawText: string) {
  if (finalType === "medical_bill") {
    const parsed = parseMedicalBillCsv(rawText);
    if (!parsed) return aiData;
    return {
      ...aiData,
      ...parsed,
      providerName: firstNonEmptyString(parsed.providerName, aiData?.providerName),
      accountNumber: firstNonEmptyString(aiData?.accountNumber),
      statementDate: firstNonEmptyString(aiData?.statementDate),
      dueDate: firstNonEmptyString(aiData?.dueDate),
      totalAmount: firstPositive(parsed.totalAmount, aiData?.totalAmount),
      currentBalance: firstPositive(parsed.currentBalance, aiData?.currentBalance, aiData?.patientResponsibility, aiData?.totalAmount),
      patientResponsibility: firstPositive(parsed.patientResponsibility, aiData?.patientResponsibility, aiData?.currentBalance, aiData?.totalAmount),
      lineItems: parsed.lineItems,
      sourceExcerpts: parsed.sourceExcerpts,
    };
  }

  if (finalType === "eob") {
    const parsed = parseEobCsv(rawText);
    if (!parsed) return aiData;
    return {
      ...aiData,
      ...parsed,
      providerName: firstNonEmptyString(parsed.providerName, aiData?.providerName),
      patientName: firstNonEmptyString(parsed.patientName, aiData?.patientName),
      billedAmount: firstPositive(parsed.billedAmount, aiData?.billedAmount, aiData?.totalAmount),
      allowedAmount: firstPositive(parsed.allowedAmount, aiData?.allowedAmount),
      planPaidAmount: firstPositive(parsed.planPaidAmount, aiData?.planPaidAmount),
      patientResponsibility: firstPositive(parsed.patientResponsibility, aiData?.patientResponsibility),
      sourceExcerpts: parsed.sourceExcerpts,
    };
  }

  return aiData;
}

function normalizeInsuranceExtractedData(data: any) {
  const copays = typeof data?.copays === "object" && data?.copays !== null ? data.copays : {};
  const pharmacyBenefits =
    typeof data?.pharmacyBenefits === "object" && data?.pharmacyBenefits !== null
      ? data.pharmacyBenefits
      : {};

  return {
    ...data,
    planName: typeof data?.planName === "string" && data.planName.trim() ? data.planName.trim() : null,
    network: typeof data?.network === "string" && data.network.trim() ? data.network.trim() : null,
    deductibleIndiv: toNumber(data?.deductibleIndiv),
    deductibleFamily: toNumber(data?.deductibleFamily),
    oopMaxIndiv: toNumber(data?.oopMaxIndiv),
    oopMaxFamily: toNumber(data?.oopMaxFamily),
    coinsuranceIn: toNumber(data?.coinsuranceIn),
    coinsuranceOut: toNumber(data?.coinsuranceOut),
    copays: {
      primaryCare: toNumber(copays.primaryCare),
      specialist: toNumber(copays.specialist),
      urgentCare: toNumber(copays.urgentCare),
      emergencyRoom: toNumber(copays.emergencyRoom),
      telehealth: toNumber(copays.telehealth),
    },
    pharmacyBenefits: {
      generic: toNumber(pharmacyBenefits.generic),
      preferred: toNumber(pharmacyBenefits.preferred),
      nonPreferred: toNumber(pharmacyBenefits.nonPreferred),
      specialty: toNumber(pharmacyBenefits.specialty),
      additionalDeductible: firstPositive(
        pharmacyBenefits.additionalDeductible,
        pharmacyBenefits.additional_deductible,
      ),
      mailOrder: firstNonEmptyString(pharmacyBenefits.mailOrder),
      notes: firstNonEmptyString(pharmacyBenefits.notes),
    },
    coverageRules: toStringArray(data?.coverageRules),
    exclusions: toStringArray(data?.exclusions),
    priorAuthRequired: toStringArray(data?.priorAuthRequired),
    appealsRules: toStringArray(data?.appealsRules),
    billingProtectionRules: toStringArray(data?.billingProtectionRules),
    negotiationRelevantRules: toStringArray(data?.negotiationRelevantRules),
    sourceExcerpts: toStringArray(data?.sourceExcerpts),
  };
}

export async function GET() {
  try {
    const documents = await getDocuments();
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
        const PdfParse = loadPdfParseNew();
        const smartParser = new PdfParse.SmartPDFParser();
        const pdfResult = await smartParser.parse(buffer);
        fileText = pdfResult.text.substring(0, 15000);
        console.log(`[DOC-UPLOAD] Successfully extracted ${fileText.length} chars. Pages: ${pdfResult.numpages}, Method: ${pdfResult._meta?.method}`);
      } catch (err: any) {
        console.error("[DOC-UPLOAD-ERROR] PDF parse failed:", err.message);
        fileText = buffer.toString("utf-8").substring(0, 5000);
        console.log("[DOC-UPLOAD] Fell back to raw binary substring.");
      }
    } else {
      console.log("[DOC-UPLOAD] File identified as CSV/Text. Extracting raw text...");
      fileText = buffer.toString("utf-8").substring(0, 5000);

      const firstLine = fileText.split("\n")[0].trim().toLowerCase();
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
    } catch (e) {
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

    console.log("[DOC-UPLOAD] Sending extracted text to OpenAI for intelligent classification...");
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
        const normalizedExtractedData =
          finalType === "insurance_plan"
            ? normalizeInsuranceExtractedData(aiResult.extractedData)
            : mergeCsvExtractedData(finalType, aiResult.extractedData, fileText);
        finalExtractedData = JSON.stringify(normalizedExtractedData);

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
            } catch (e) {
              console.error("Cleanup error:", e);
            }
          }
        }

        // Update dashboard (InsurancePlan) if valid insurance plan uploaded
        if (finalType === "insurance_plan" && aiResult.extractedData) {
          const firstPlan = await prisma.insurancePlan.findFirst();
          if (firstPlan) {
            const data = normalizedExtractedData;
            await prisma.insurancePlan.update({
              where: { id: firstPlan.id },
              data: {
                name: data.planName || "",
                provider: data.network || "",
                deductibleIndiv: data.deductibleIndiv,
                deductibleFamily: data.deductibleFamily,
                oopMaxIndiv: data.oopMaxIndiv,
                oopMaxFamily: data.oopMaxFamily,
                coinsuranceIn: data.coinsuranceIn,
                coinsuranceOut: data.coinsuranceOut,

                // Deep Structured Extraction Fields
                copays: JSON.stringify(data.copays),
                pharmacyBenefits: JSON.stringify(data.pharmacyBenefits),
                coverageRules: JSON.stringify(data.coverageRules),
                exclusions: JSON.stringify(data.exclusions),
                priorAuthRequired: JSON.stringify(data.priorAuthRequired),
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

        if (finalStatus === "ready") {
          await syncDocumentModels(doc.id);
        }
      }
    }).catch(console.error);

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

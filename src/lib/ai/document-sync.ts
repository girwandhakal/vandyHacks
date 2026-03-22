import { prisma } from "@/lib/db";

function safeParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeDate(value: unknown) {
  const text = cleanString(value);
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toISOString().slice(0, 10);
}

function normalizeProviderName(value: unknown) {
  const provider = cleanString(value);
  return provider ? provider.replace(/\s+/g, " ").trim() : null;
}

function inferCareType(providerName: string | null, raw: Record<string, unknown>) {
  const haystack = `${providerName || ""} ${cleanString(raw.careType) || ""} ${cleanString(raw.description) || ""}`.toLowerCase();
  if (haystack.includes("urgent")) return "urgent_care";
  if (haystack.includes("emergency") || haystack.includes("er")) return "emergency_room";
  if (haystack.includes("lab")) return "lab";
  if (haystack.includes("surgery")) return "surgery";
  if (haystack.includes("radiology") || haystack.includes("imaging") || haystack.includes("mri")) return "imaging";
  if (haystack.includes("hospital")) return "hospital";
  if (haystack.includes("specialist")) return "specialist";
  return "general_medical";
}

function buildDocumentNotes(raw: Record<string, unknown>) {
  return JSON.stringify({
    lineItems: Array.isArray(raw.lineItems) ? raw.lineItems : [],
    paymentOptions: raw.paymentOptions || [],
    financialAssistance: raw.financialAssistance || [],
    discounts: raw.discounts || [],
    sourceExcerpts: raw.sourceExcerpts || [],
    raw,
  });
}

function providerScore(left?: string | null, right?: string | null) {
  if (!left || !right) return 0;
  const a = left.toLowerCase();
  const b = right.toLowerCase();
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;
  const aTokens = new Set(a.split(/[^a-z0-9]+/).filter(Boolean));
  const bTokens = new Set(b.split(/[^a-z0-9]+/).filter(Boolean));
  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  const denom = Math.max(aTokens.size, bTokens.size, 1);
  return overlap / denom;
}

function amountScore(left: number, right: number) {
  if (!left || !right) return 0;
  const delta = Math.abs(left - right);
  if (delta <= 5) return 1;
  if (delta <= 25) return 0.75;
  if (delta <= 100) return 0.35;
  return 0;
}

function dateScore(left?: string | null, right?: string | null) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const a = new Date(left).getTime();
  const b = new Date(right).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  const diffDays = Math.abs(a - b) / (1000 * 60 * 60 * 24);
  if (diffDays <= 3) return 0.75;
  if (diffDays <= 14) return 0.35;
  return 0;
}

function buildReconciliationStatus(score: number, balanceDelta: number, providerMatch: number, dateMatch: number) {
  if (score < 0.35) return "missing_eob";
  if (balanceDelta > 25) return "amount_mismatch";
  if (providerMatch < 0.5) return "provider_mismatch";
  if (dateMatch < 0.35) return "service_date_mismatch";
  return "matched";
}

async function getPrimaryUserId() {
  const user = await prisma.user.findFirst({ select: { id: true } });
  return user?.id || null;
}

async function upsertMedicalBillFromDocument(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document || document.type !== "medical_bill" || document.status !== "ready") return null;

  const data = safeParse<Record<string, unknown>>(document.extractedData, {});
  const providerName = normalizeProviderName(data.providerName);
  const currentBalance = toNumber(data.currentBalance, toNumber(data.patientResponsibility, toNumber(data.totalAmount)));
  const notesJson = buildDocumentNotes(data);
  const existing = await prisma.medicalBill.findFirst({ where: { documentId } });

  const payload = {
    userId,
    documentId,
    providerName,
    accountNumber: cleanString(data.accountNumber),
    statementDate: normalizeDate(data.statementDate),
    dueDate: normalizeDate(data.dueDate),
    dateOfServiceStart: normalizeDate(data.dateOfServiceStart || data.dateOfService),
    dateOfServiceEnd: normalizeDate(data.dateOfServiceEnd || data.dateOfService),
    originalAmount: toNumber(data.totalAmount),
    currentBalance,
    patientResponsibility: toNumber(data.patientResponsibility, currentBalance),
    status: document.isSettled ? "paid" : "open",
    careType: inferCareType(providerName, data),
    isFacilityBill: Boolean(data.isFacilityBill) || /hospital|center|facility/i.test(providerName || ""),
    isProfessionalBill: Boolean(data.isProfessionalBill),
    inNetworkStatus: cleanString(data.inNetworkStatus),
    negotiationEligible: data.negotiationEligible === false ? false : true,
    charityCareEligible:
      Boolean(data.charityCareEligible) ||
      notesJson.toLowerCase().includes("charity") ||
      notesJson.toLowerCase().includes("financial assistance"),
    installmentPlanAvailable:
      data.installmentPlanAvailable === false
        ? false
        : notesJson.toLowerCase().includes("payment plan") || notesJson.toLowerCase().includes("installment"),
    notesJson,
  };

  if (existing) {
    return prisma.medicalBill.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.medicalBill.create({ data: payload });
}

async function upsertEobFromDocument(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document || document.type !== "eob" || document.status !== "ready") return null;

  const data = safeParse<Record<string, unknown>>(document.extractedData, {});
  const existing = await prisma.explanationOfBenefits.findFirst({ where: { documentId } });

  const payload = {
    userId,
    documentId,
    claimNumber: cleanString(data.claimNumber),
    payerName: cleanString(data.payerName),
    providerName: normalizeProviderName(data.providerName),
    patientName: cleanString(data.patientName),
    statementDate: normalizeDate(data.statementDate),
    dateOfServiceStart: normalizeDate(data.dateOfServiceStart || data.dateOfService),
    dateOfServiceEnd: normalizeDate(data.dateOfServiceEnd || data.dateOfService),
    billedAmount: toNumber(data.billedAmount, toNumber(data.totalAmount)),
    allowedAmount: toNumber(data.allowedAmount),
    planPaidAmount: toNumber(data.planPaidAmount),
    patientResponsibility: toNumber(data.patientResponsibility),
    deductibleApplied: toNumber(data.deductibleApplied),
    coinsuranceApplied: toNumber(data.coinsuranceApplied),
    copayApplied: toNumber(data.copayApplied),
    nonCoveredAmount: toNumber(data.nonCoveredAmount),
    outOfNetworkPenalty: toNumber(data.outOfNetworkPenalty),
    claimStatus: cleanString(data.claimStatus),
    denialReason: cleanString(data.denialReason),
    notesJson: buildDocumentNotes(data),
  };

  if (existing) {
    return prisma.explanationOfBenefits.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.explanationOfBenefits.create({ data: payload });
}

async function upsertInsurancePlanSummary(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document || document.type !== "insurance_plan" || document.status !== "ready") return null;

  const data = safeParse<Record<string, unknown>>(document.extractedData, {});
  const plan = await prisma.insurancePlan.findFirst({ select: { id: true } });
  const existing = await prisma.insurancePlanDocumentSummary.findFirst({ where: { documentId } });
  const payload = {
    userId,
    documentId,
    planId: plan?.id,
    planOverviewJson: JSON.stringify({
      planName: data.planName || document.name,
      network: data.network || null,
      deductibleIndiv: toNumber(data.deductibleIndiv),
      deductibleFamily: toNumber(data.deductibleFamily),
      oopMaxIndiv: toNumber(data.oopMaxIndiv),
      oopMaxFamily: toNumber(data.oopMaxFamily),
      pharmacyBenefits: data.pharmacyBenefits || {},
    }),
    costSharingRulesJson: JSON.stringify({
      copays: data.copays || {},
      coverageRules: Array.isArray(data.coverageRules) ? data.coverageRules : [],
      exclusions: Array.isArray(data.exclusions) ? data.exclusions : [],
    }),
    priorAuthRulesJson: JSON.stringify(Array.isArray(data.priorAuthRequired) ? data.priorAuthRequired : []),
    appealsRulesJson: JSON.stringify(Array.isArray(data.appealsRules) ? data.appealsRules : []),
    billingProtectionRulesJson: JSON.stringify(Array.isArray(data.billingProtectionRules) ? data.billingProtectionRules : []),
    negotiationRelevantRulesJson: JSON.stringify(Array.isArray(data.negotiationRelevantRules) ? data.negotiationRelevantRules : []),
    sourceExcerptsJson: JSON.stringify(Array.isArray(data.sourceExcerpts) ? data.sourceExcerpts : []),
    version: "v2",
  };

  if (existing) {
    return prisma.insurancePlanDocumentSummary.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.insurancePlanDocumentSummary.create({ data: payload });
}

async function findBestBillMatchForEob(userId: string, eobId: string) {
  const eob = await prisma.explanationOfBenefits.findUnique({ where: { id: eobId } });
  if (!eob) return null;

  const bills = await prisma.medicalBill.findMany({
    where: {
      userId,
      status: { not: "paid" },
    },
  });

  let best: { billId: string; score: number; balanceDelta: number; providerMatch: number; dateMatch: number } | null = null;

  for (const bill of bills) {
    const providerMatch = providerScore(bill.providerName, eob.providerName);
    const dateMatch = dateScore(bill.dateOfServiceStart, eob.dateOfServiceStart);
    const balanceMatch = amountScore(bill.patientResponsibility || bill.currentBalance, eob.patientResponsibility);
    const score = providerMatch * 0.4 + dateMatch * 0.25 + balanceMatch * 0.35;
    const balanceDelta = Math.abs((bill.patientResponsibility || bill.currentBalance || 0) - (eob.patientResponsibility || 0));

    if (!best || score > best.score) {
      best = {
        billId: bill.id,
        score,
        balanceDelta,
        providerMatch,
        dateMatch,
      };
    }
  }

  return best && best.score >= 0.35 ? best : null;
}

export async function createBillEobLink(params: {
  userId: string;
  medicalBillId: string;
  eobId: string;
  matchedBy?: string;
  matchConfidence?: number;
}) {
  const { userId, medicalBillId, eobId, matchedBy = "rule", matchConfidence = 1 } = params;
  const bill = await prisma.medicalBill.findUnique({ where: { id: medicalBillId } });
  const eob = await prisma.explanationOfBenefits.findUnique({ where: { id: eobId } });
  if (!bill || !eob) return null;

  const balanceDelta = Math.abs((bill.patientResponsibility || bill.currentBalance || 0) - (eob.patientResponsibility || 0));
  const providerMatch = providerScore(bill.providerName, eob.providerName);
  const dateMatch = dateScore(bill.dateOfServiceStart, eob.dateOfServiceStart);
  const reconciliationStatus = buildReconciliationStatus(matchConfidence, balanceDelta, providerMatch, dateMatch);

  const existing = await prisma.billEobLink.findFirst({ where: { eobId } });
  const payload = {
    userId,
    medicalBillId,
    eobId,
    matchedBy,
    matchConfidence,
    reconciliationStatus,
    balanceDelta,
    notesJson: JSON.stringify({ providerMatch, dateMatch }),
  };

  const link = existing
    ? await prisma.billEobLink.update({ where: { id: existing.id }, data: payload })
    : await prisma.billEobLink.create({ data: payload });

  const billDocumentId = bill.documentId || null;
  const eobDocumentId = eob.documentId || null;
  if (eobDocumentId) {
    await prisma.document.update({
      where: { id: eobDocumentId },
      data: { linkedBillId: billDocumentId },
    });
  }

  return link;
}

export async function removeBillEobLinkForEobDocument(eobDocumentId: string) {
  const eob = await prisma.explanationOfBenefits.findFirst({ where: { documentId: eobDocumentId } });
  if (eob) {
    await prisma.billEobLink.deleteMany({ where: { eobId: eob.id } });
  }
  await prisma.document.update({
    where: { id: eobDocumentId },
    data: { linkedBillId: null },
  });
}

export async function syncDocumentModels(documentId: string, explicitUserId?: string) {
  const userId = explicitUserId || (await getPrimaryUserId());
  if (!userId) return null;

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) return null;

  if (document.type === "insurance_plan") {
    return upsertInsurancePlanSummary(documentId, userId);
  }

  if (document.type === "medical_bill") {
    const bill = await upsertMedicalBillFromDocument(documentId, userId);
    if (bill) {
      const linkedEobs = await prisma.document.findMany({
        where: { type: "eob", linkedBillId: documentId, status: "ready" },
        select: { id: true },
      });
      for (const eobDoc of linkedEobs) {
        const eob = await upsertEobFromDocument(eobDoc.id, userId);
        if (eob) {
          await createBillEobLink({
            userId,
            medicalBillId: bill.id,
            eobId: eob.id,
            matchedBy: "manual",
            matchConfidence: 1,
          });
        }
      }
    }
    return bill;
  }

  if (document.type === "eob") {
    const eob = await upsertEobFromDocument(documentId, userId);
    if (!eob) return null;

    if (document.linkedBillId) {
      const bill = await prisma.medicalBill.findFirst({ where: { documentId: document.linkedBillId } });
      if (bill) {
        await createBillEobLink({
          userId,
          medicalBillId: bill.id,
          eobId: eob.id,
          matchedBy: "manual",
          matchConfidence: 1,
        });
        return eob;
      }
    }

    const match = await findBestBillMatchForEob(userId, eob.id);
    if (match) {
      await createBillEobLink({
        userId,
        medicalBillId: match.billId,
        eobId: eob.id,
        matchedBy: "rule",
        matchConfidence: match.score,
      });
    }

    return eob;
  }

  return null;
}

export async function syncAllNormalizedDocuments(userId?: string) {
  const resolvedUserId = userId || (await getPrimaryUserId());
  if (!resolvedUserId) return;

  const documents = await prisma.document.findMany({
    where: {
      status: "ready",
      type: { in: ["insurance_plan", "medical_bill", "eob"] },
    },
    orderBy: { uploadedAt: "asc" },
    select: { id: true },
  });

  for (const document of documents) {
    await syncDocumentModels(document.id, resolvedUserId);
  }
}

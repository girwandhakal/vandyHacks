import fs from "fs";
import path from "path";
import type { Message } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeAffordabilityRisk } from "@/lib/plaid/analytics";
import { classifyAssistantIntent, type AssistantIntent } from "@/lib/ai/intents";
import { syncAllNormalizedDocuments } from "@/lib/ai/document-sync";
import { buildMedicalDebtStrategies } from "@/lib/ai/strategies/medical-debt-strategies";

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
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function shorten(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
}

function formatMoney(value?: number | null) {
  return `$${toNumber(value).toFixed(2)}`;
}

function normalizeProviderName(text?: string | null) {
  return text?.toLowerCase().replace(/\s+/g, " ").trim() || "";
}

function providerMentionScore(providerName: string | null | undefined, message: string) {
  const provider = normalizeProviderName(providerName);
  if (!provider) return 0;
  const haystack = message.toLowerCase();
  if (haystack.includes(provider)) return 1;
  const tokens = provider.split(/[^a-z0-9]+/).filter(Boolean);
  const matches = tokens.filter((token) => token.length > 3 && haystack.includes(token)).length;
  return matches / Math.max(tokens.length, 1);
}

function amountMentionScore(amount: number, message: string) {
  if (!amount) return 0;
  const numeric = Math.round(amount).toString();
  if (message.includes(numeric)) return 1;
  const currency = amount.toFixed(2);
  if (message.includes(currency)) return 1;
  return 0;
}

function summarizeOlderMessages(messages: { role: string; content: string }[]) {
  if (messages.length <= 6) return "";
  const older = messages.slice(0, -6);
  return older
    .map((message) => `${message.role}: ${shorten(message.content.replace(/\s+/g, " "), 120)}`)
    .join(" | ");
}

function recentMessages(messages: { role: string; content: string }[]) {
  return messages.slice(-6).map((message) => ({
    role: message.role,
    content: shorten(message.content, 350),
  }));
}

function loadDocumentExcerpt(filePath: string | null | undefined, query: string, maxChars: number) {
  if (!filePath) return null;
  const relative = filePath.replace(/^[/\\]+/, "");
  const txtPath = path.join(process.cwd(), `${relative}.txt`);
  if (!fs.existsSync(txtPath)) return null;

  try {
    const text = fs.readFileSync(txtPath, "utf-8");
    const lowered = text.toLowerCase();
    const keywords = query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 4)
      .slice(0, 8);

    let start = 0;
    for (const keyword of keywords) {
      const idx = lowered.indexOf(keyword);
      if (idx >= 0) {
        start = Math.max(0, idx - 120);
        break;
      }
    }

    return shorten(text.slice(start, start + maxChars).replace(/\s+/g, " ").trim(), maxChars);
  } catch {
    return null;
  }
}

async function buildFinancialSnapshot(userId: string) {
  let snapshot = await prisma.financialProfileSnapshot.findFirst({
    where: { userId },
    orderBy: { asOfDate: "desc" },
  });

  if (!snapshot) {
    const accounts = await prisma.plaidAccount.findMany({ where: { userId } });
    const transactions = await prisma.plaidTransactionNormalized.findMany({
      where: { userId },
      include: { rawTransaction: true },
      orderBy: { rawTransaction: { datePosted: "desc" } },
      take: 100,
    });

    let income = 0;
    let fixedCosts = 0;
    let variableCosts = 0;
    let medicalSpend = 0;
    let debtPayments = 0;

    for (const transaction of transactions) {
      const amount = Math.abs(transaction.rawTransaction.amount || 0);
      if (transaction.normalizedCategory === "INCOME") income += amount;
      else if (transaction.normalizedCategory === "MEDICAL") medicalSpend += amount;
      else if (transaction.normalizedCategory === "DEBT_PAYMENT") debtPayments += amount;
      else if (transaction.essentialityScore === "essential") fixedCosts += amount;
      else variableCosts += amount;
    }

    const checkingLiquidity = accounts
      .filter((account) => ["checking", "savings"].includes((account.subtype || "").toLowerCase()))
      .reduce((sum, account) => sum + (account.availableBalance ?? account.currentBalance ?? 0), 0);
    const hsaBalance = accounts
      .filter((account) => `${account.name} ${account.officialName || ""}`.toLowerCase().includes("hsa"))
      .reduce((sum, account) => sum + (account.availableBalance ?? account.currentBalance ?? 0), 0);
    const fsaBalance = accounts
      .filter((account) => `${account.name} ${account.officialName || ""}`.toLowerCase().includes("fsa"))
      .reduce((sum, account) => sum + (account.availableBalance ?? account.currentBalance ?? 0), 0);

    const freeCashFlow = Math.max(0, income - fixedCosts - variableCosts - debtPayments);
    snapshot = await prisma.financialProfileSnapshot.create({
      data: {
        userId,
        monthlyIncomeEstimate: income,
        monthlyFixedCosts: fixedCosts,
        monthlyVariableCosts: variableCosts,
        monthlyMedicalSpend: medicalSpend,
        monthlyDebtPayments: debtPayments,
        savingsRate: income > 0 ? freeCashFlow / income : 0,
        freeCashFlow,
        affordabilityRiskLevel: computeAffordabilityRisk({
          incomeEstimate: income,
          fixedCosts,
          variableCosts,
          debtPayments,
          medicalSpend,
          savingsBuffer: checkingLiquidity + hsaBalance + fsaBalance,
        }),
        checkingLiquidity,
        hsaBalance,
        fsaBalance,
        availableMedicalPaymentCapacityNow: checkingLiquidity + hsaBalance + fsaBalance,
        availableMedicalPaymentCapacityMonthly: freeCashFlow,
        monthlyEssentialSpend: fixedCosts,
        monthlyDiscretionarySpend: variableCosts,
      },
    });
  }

  const freeCashFlow =
    snapshot.freeCashFlow ??
    toNumber(snapshot.monthlyIncomeEstimate) -
      toNumber(snapshot.monthlyFixedCosts) -
      toNumber(snapshot.monthlyVariableCosts) -
      toNumber(snapshot.monthlyDebtPayments);

  return {
    asOfDate: snapshot.asOfDate,
    monthlyIncomeEstimate: toNumber(snapshot.monthlyIncomeEstimate),
    monthlyFixedCosts: toNumber(snapshot.monthlyFixedCosts),
    monthlyVariableCosts: toNumber(snapshot.monthlyVariableCosts),
    monthlyDebtPayments: toNumber(snapshot.monthlyDebtPayments),
    monthlyMedicalSpend: toNumber(snapshot.monthlyMedicalSpend),
    freeCashFlow: toNumber(snapshot.freeCashFlow, freeCashFlow),
    affordabilityRiskLevel:
      snapshot.affordabilityRiskLevel ||
      computeAffordabilityRisk({
        incomeEstimate: toNumber(snapshot.monthlyIncomeEstimate),
        fixedCosts: toNumber(snapshot.monthlyFixedCosts),
        variableCosts: toNumber(snapshot.monthlyVariableCosts),
        debtPayments: toNumber(snapshot.monthlyDebtPayments),
        medicalSpend: toNumber(snapshot.monthlyMedicalSpend),
        savingsBuffer: toNumber(snapshot.checkingLiquidity) + toNumber(snapshot.hsaBalance) + toNumber(snapshot.fsaBalance),
      }),
    checkingLiquidity: toNumber(snapshot.checkingLiquidity),
    hsaBalance: toNumber(snapshot.hsaBalance),
    fsaBalance: toNumber(snapshot.fsaBalance),
    availableMedicalPaymentCapacityNow: toNumber(
      snapshot.availableMedicalPaymentCapacityNow,
      toNumber(snapshot.checkingLiquidity) + toNumber(snapshot.hsaBalance) + toNumber(snapshot.fsaBalance),
    ),
    availableMedicalPaymentCapacityMonthly: toNumber(snapshot.availableMedicalPaymentCapacityMonthly, freeCashFlow),
    hardshipIndicators: safeParse<string[]>(snapshot.hardshipIndicatorsJson, []),
  };
}

async function selectRelevantBills(params: {
  userId: string;
  message: string;
  explicitBillId?: string;
  intent: AssistantIntent;
}) {
  const { userId, message, explicitBillId, intent } = params;
  const allBills = await prisma.medicalBill.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      document: true,
      eobLinks: {
        include: {
          eob: {
            include: {
              document: true,
            },
          },
        },
      },
    },
  });

  if (!allBills.length) return [];

  if (explicitBillId) {
    const explicit = allBills.find((bill) => bill.id === explicitBillId || bill.documentId === explicitBillId);
    if (explicit) return [explicit];
  }

  const messageLower = message.toLowerCase();
  const scored = allBills.map((bill) => {
    let score = 0;
    score += providerMentionScore(bill.providerName, messageLower) * 3;
    score += amountMentionScore(bill.currentBalance || bill.patientResponsibility || 0, messageLower) * 3;
    if (messageLower.includes("this bill") || messageLower.includes("that bill")) score += 1;
    if (bill.status !== "paid") score += 1;
    return { bill, score };
  });

  scored.sort((left, right) => right.score - left.score);

  if (intent === "specific_bill_payment_question" || intent === "bill_vs_eob_dispute_question" || intent === "claim_denial_or_appeal_question") {
    return [scored[0]?.bill || allBills[0]].filter(Boolean);
  }

  return scored
    .filter((entry) => entry.score > 0 || entry.bill.status !== "paid")
    .slice(0, 3)
    .map((entry) => entry.bill);
}

function buildInsuranceSummary(plan: Awaited<ReturnType<typeof prisma.insurancePlan.findFirst>>, brochure: Awaited<ReturnType<typeof prisma.insurancePlanDocumentSummary.findFirst>>) {
  if (!plan) return { summary: "No insurance plan is available.", keyRules: [], brochureExcerpts: [] as string[] };

  const copays = safeParse<Record<string, number>>(plan.copays, {});
  const coverageRules = safeParse<string[]>(plan.coverageRules, []);
  const priorAuth = safeParse<string[]>(plan.priorAuthRequired, []);
  const brochureExcerpts = brochure ? safeParse<string[]>(brochure.sourceExcerptsJson, []) : [];

  return {
    summary: {
      plan: plan.name,
      provider: plan.provider,
      type: plan.type,
      planYear: { start: plan.planYearStart, end: plan.planYearEnd },
      deductible: {
        individual: plan.deductibleIndiv,
        met: plan.deductibleMetIndiv,
      },
      outOfPocket: {
        max: plan.oopMaxIndiv,
        spent: plan.oopSpentIndiv,
      },
      copays: {
        primaryCare: copays.primaryCare || 0,
        specialist: copays.specialist || 0,
        urgentCare: copays.urgentCare || 0,
        emergencyRoom: copays.emergencyRoom || 0,
        telehealth: copays.telehealth || 0,
      },
    },
    keyRules: [...coverageRules.slice(0, 4), ...priorAuth.slice(0, 2)].slice(0, 5),
    brochureExcerpts,
  };
}

function trimPacket(packet: Record<string, unknown>, maxTokens: number) {
  let truncated = false;
  const clone = JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;

  const enforce = () => estimateTokens(JSON.stringify(clone)) <= maxTokens;
  if (enforce()) return { packet: clone, truncated };

  truncated = true;
  const insurance = clone.insurance as { brochureExcerpts?: string[] } | undefined;
  if (insurance?.brochureExcerpts?.length) {
    insurance.brochureExcerpts = insurance.brochureExcerpts.slice(0, 1).map((excerpt) => shorten(excerpt, 320));
  }
  if (enforce()) return { packet: clone, truncated };

  const bills = clone.relevantBills as Array<{ billExcerpt?: string; eobExcerpt?: string }> | undefined;
  if (bills?.length) {
    clone.relevantBills = bills.slice(0, 1).map((bill) => ({
      ...bill,
      billExcerpt: bill.billExcerpt ? shorten(bill.billExcerpt, 300) : undefined,
      eobExcerpt: bill.eobExcerpt ? shorten(bill.eobExcerpt, 220) : undefined,
    }));
  }
  if (enforce()) return { packet: clone, truncated };

  const conversation = clone.conversation as { summary?: string; recentMessages?: unknown[] } | undefined;
  if (conversation) {
    conversation.summary = shorten(conversation.summary || "", 220);
    conversation.recentMessages = Array.isArray(conversation.recentMessages)
      ? conversation.recentMessages.slice(-4)
      : [];
  }

  return { packet: clone, truncated };
}

export async function buildContextPacket(params: {
  userId: string;
  userMessage: string;
  conversationHistory: Pick<Message, "role" | "content">[];
  explicitBillId?: string;
}) {
  const { userId, userMessage, conversationHistory, explicitBillId } = params;
  await syncAllNormalizedDocuments(userId);

  const intent = classifyAssistantIntent(userMessage, Boolean(explicitBillId));
  const [user, financial, plan, brochureSummary, bills] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
    buildFinancialSnapshot(userId),
    prisma.insurancePlan.findFirst(),
    prisma.insurancePlanDocumentSummary.findFirst({ orderBy: { updatedAt: "desc" } }),
    selectRelevantBills({ userId, message: userMessage, explicitBillId, intent }),
  ]);

  const insurance = buildInsuranceSummary(plan, brochureSummary);
  const relevantBills = await Promise.all(bills.map(async (bill) => {
    const bestLink = bill.eobLinks[0];
    const eob = bestLink?.eob || null;
    const strategies = buildMedicalDebtStrategies({
      profile: financial,
      bill,
      eob,
      insurance: plan
        ? {
            deductibleIndiv: plan.deductibleIndiv,
            deductibleMetIndiv: plan.deductibleMetIndiv,
            oopMaxIndiv: plan.oopMaxIndiv,
            oopSpentIndiv: plan.oopSpentIndiv,
          }
        : null,
    });

    await prisma.medicalDebtStrategySnapshot.create({
      data: {
        userId,
        medicalBillId: bill.id,
        recommendedPrimaryStrategy: strategies.recommendedPrimaryStrategy,
        strategyRankingJson: JSON.stringify(
          strategies.options.map((option) => ({
            label: option.label,
            recommended: option.recommended,
            feasibility: option.feasibility,
            monthlyCost: option.monthlyCost,
            totalCost: option.totalCost,
          })),
        ),
        payNowScore: strategies.scores.payNowScore,
        installmentScore: strategies.scores.installmentScore,
        negotiationScore: strategies.scores.negotiationScore,
        charityScore: strategies.scores.charityScore,
        loanScore: strategies.scores.loanScore,
        appealScore: strategies.scores.appealScore,
        confidence: strategies.confidence,
      },
    });

    return {
      billId: bill.id,
      documentId: bill.documentId,
      providerName: bill.providerName,
      careType: bill.careType,
      status: bill.status,
      currentBalance: bill.currentBalance,
      patientResponsibility: bill.patientResponsibility,
      dueDate: bill.dueDate,
      inNetworkStatus: bill.inNetworkStatus,
      billAssessment: strategies.billAssessment,
      insuranceAssessment: strategies.insuranceAssessment,
      financialSummary: strategies.financialSummary,
      recommendedPrimaryStrategy: strategies.recommendedPrimaryStrategy,
      strategyOptions: strategies.options.slice(0, 5).map((option) => ({
        label: option.label,
        recommended: option.recommended,
        feasibility: option.feasibility,
        monthlyCost: option.monthlyCost,
        totalCost: option.totalCost,
        whyItFitsUser: option.whyItFitsUser,
      })),
      mismatchFlags: strategies.mismatchFlags,
      confidence: strategies.confidence,
      linkedEob: eob
        ? {
            eobId: eob.id,
            documentId: eob.documentId,
            claimStatus: eob.claimStatus,
            patientResponsibility: eob.patientResponsibility,
            deductibleApplied: eob.deductibleApplied,
            denialReason: eob.denialReason,
          }
        : null,
      billExcerpt: loadDocumentExcerpt(bill.document?.filePath, userMessage, 480),
      eobExcerpt: loadDocumentExcerpt(eob?.document?.filePath, userMessage, 420),
    };
  }));

  const contextPacket = {
    packetVersion: "v2-balanced-medical-financial",
    intent,
    user: {
      id: user?.id,
      name: user?.name,
    },
    financialProfile: {
      asOfDate: financial.asOfDate,
      monthlyIncomeEstimate: financial.monthlyIncomeEstimate,
      monthlyFixedCosts: financial.monthlyFixedCosts,
      monthlyVariableCosts: financial.monthlyVariableCosts,
      monthlyDebtPayments: financial.monthlyDebtPayments,
      monthlyMedicalSpend: financial.monthlyMedicalSpend,
      freeCashFlow: financial.freeCashFlow,
      affordabilityRiskLevel: financial.affordabilityRiskLevel,
      checkingLiquidity: financial.checkingLiquidity,
      hsaBalance: financial.hsaBalance,
      fsaBalance: financial.fsaBalance,
      availableMedicalPaymentCapacityNow: financial.availableMedicalPaymentCapacityNow,
      availableMedicalPaymentCapacityMonthly: financial.availableMedicalPaymentCapacityMonthly,
      hardshipIndicators: financial.hardshipIndicators,
      summary: `Monthly income ${formatMoney(financial.monthlyIncomeEstimate)}, free cash flow ${formatMoney(financial.freeCashFlow)}, liquid medical payment capacity now ${formatMoney(financial.availableMedicalPaymentCapacityNow)}, monthly capacity ${formatMoney(financial.availableMedicalPaymentCapacityMonthly)}.`,
    },
    insurance,
    relevantBills,
    conversation: {
      summary: summarizeOlderMessages(conversationHistory),
      recentMessages: recentMessages(conversationHistory),
    },
  };

  const budget = intent === "specific_bill_payment_question" || intent === "bill_vs_eob_dispute_question" ? 2500 : 1500;
  const trimmed = trimPacket(contextPacket, budget);
  const tokenBudgetUsed = estimateTokens(JSON.stringify(trimmed.packet));

  return {
    intent,
    packet: trimmed.packet,
    metadata: {
      intent,
      referencedBillIds: relevantBills.map((bill) => bill.billId).filter(Boolean),
      referencedEobIds: relevantBills
        .map((bill) => bill.linkedEob?.eobId)
        .filter((id): id is string => Boolean(id)),
      tokenBudgetUsed,
      truncated: trimmed.truncated,
      packetVersion: "v2-balanced-medical-financial",
    },
  };
}

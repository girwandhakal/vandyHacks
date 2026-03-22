import OpenAI from "openai";
import { buildContextPacket } from "@/lib/ai/context/build-context-packet";
import { buildMedicalFinancialAdvisorPrompt } from "@/lib/ai/prompts/medical-financial-advisor";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

type StrategyOption = {
  label: string;
  recommended: boolean;
  feasibility: "high" | "medium" | "low";
  monthlyCost: number;
  totalCost: number;
  pros: string[];
  cons: string[];
  requiredActions: string[];
  whyItFitsUser: string;
};

type StructuredResponse = {
  answer: string;
  situationSummary: string;
  billAssessment: string;
  insuranceAssessment: string;
  financialAssessment: string;
  recommendedStrategy: string;
  strategyOptions: StrategyOption[];
  immediateNextSteps: string[];
  documentsReferenced: Array<{ id: string; type: string; label: string }>;
  assumptions: string[];
  missingInformation: string[];
  confidenceLevel: "high" | "medium" | "low";
  followUpQuestions: string[];
};

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function cleanResponseText(text: string) {
  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }
  return cleanText.trim();
}

function normalizeStrategyOption(option: any): StrategyOption {
  return {
    label: typeof option?.label === "string" ? option.label : "Unnamed strategy",
    recommended: Boolean(option?.recommended),
    feasibility:
      option?.feasibility === "low" || option?.feasibility === "medium" || option?.feasibility === "high"
        ? option.feasibility
        : "medium",
    monthlyCost: Number(option?.monthlyCost) || 0,
    totalCost: Number(option?.totalCost) || 0,
    pros: Array.isArray(option?.pros) ? option.pros.map(String).slice(0, 4) : [],
    cons: Array.isArray(option?.cons) ? option.cons.map(String).slice(0, 4) : [],
    requiredActions: Array.isArray(option?.requiredActions) ? option.requiredActions.map(String).slice(0, 4) : [],
    whyItFitsUser: typeof option?.whyItFitsUser === "string" ? option.whyItFitsUser : "",
  };
}

function normalizeStructuredResponse(parsed: any, contextPacket: any): StructuredResponse {
  const firstBill = contextPacket?.relevantBills?.[0];
  const fallbackDocs = [
    ...(firstBill
      ? [
          {
            id: firstBill.documentId || firstBill.billId,
            type: "medical_bill",
            label: `${firstBill.providerName || "Medical bill"} bill`,
          },
        ]
      : []),
    ...(firstBill?.linkedEob
      ? [
          {
            id: firstBill.linkedEob.documentId || firstBill.linkedEob.eobId,
            type: "eob",
            label: `${firstBill.providerName || "Linked"} EOB`,
          },
        ]
      : []),
    ...(contextPacket?.insurance?.summary
      ? [
          {
            id: "insurance-plan",
            type: "insurance_plan",
            label: String(contextPacket.insurance.summary.plan || "Insurance plan"),
          },
        ]
      : []),
    { id: "financial-profile", type: "financial_profile", label: "Financial profile snapshot" },
  ];

  return {
    answer: typeof parsed?.answer === "string" ? parsed.answer : typeof parsed?.recommendedStrategy === "string" ? parsed.recommendedStrategy : "",
    situationSummary: typeof parsed?.situationSummary === "string" ? parsed.situationSummary : "",
    billAssessment: typeof parsed?.billAssessment === "string" ? parsed.billAssessment : firstBill?.billAssessment || "",
    insuranceAssessment:
      typeof parsed?.insuranceAssessment === "string" ? parsed.insuranceAssessment : firstBill?.insuranceAssessment || "",
    financialAssessment:
      typeof parsed?.financialAssessment === "string" ? parsed.financialAssessment : firstBill?.financialSummary || "",
    recommendedStrategy:
      typeof parsed?.recommendedStrategy === "string"
        ? parsed.recommendedStrategy
        : firstBill?.recommendedPrimaryStrategy || "Review the bill before paying",
    strategyOptions: Array.isArray(parsed?.strategyOptions)
      ? parsed.strategyOptions.map(normalizeStrategyOption).slice(0, 5)
      : [],
    immediateNextSteps: Array.isArray(parsed?.immediateNextSteps) ? parsed.immediateNextSteps.map(String).slice(0, 5) : [],
    documentsReferenced: Array.isArray(parsed?.documentsReferenced) && parsed.documentsReferenced.length
      ? parsed.documentsReferenced
          .map((item: any) => ({
            id: typeof item?.id === "string" ? item.id : "unknown",
            type: typeof item?.type === "string" ? item.type : "medical_bill",
            label: typeof item?.label === "string" ? item.label : "Referenced document",
          }))
          .slice(0, 5)
      : fallbackDocs,
    assumptions: Array.isArray(parsed?.assumptions) ? parsed.assumptions.map(String).slice(0, 5) : [],
    missingInformation: Array.isArray(parsed?.missingInformation) ? parsed.missingInformation.map(String).slice(0, 5) : [],
    confidenceLevel:
      parsed?.confidenceLevel === "low" || parsed?.confidenceLevel === "medium" || parsed?.confidenceLevel === "high"
        ? parsed.confidenceLevel
        : "medium",
    followUpQuestions: Array.isArray(parsed?.followUpQuestions) ? parsed.followUpQuestions.map(String).slice(0, 4) : [],
  };
}

export async function chatWithGemini(params: {
  userId: string;
  userMessage: string;
  conversationHistory: { role: string; content: string }[];
  explicitBillId?: string;
}): Promise<{
  content: string;
  structuredResponse?: StructuredResponse;
  contextMeta: {
    intent: string;
    referencedBillIds: string[];
    referencedEobIds: string[];
    tokenBudgetUsed: number;
    truncated: boolean;
    packetVersion: string;
  };
}> {
  const { userId, userMessage, conversationHistory, explicitBillId } = params;
  const { packet, metadata } = await buildContextPacket({
    userId,
    userMessage,
    conversationHistory,
    explicitBillId,
  });

  const systemPrompt = buildMedicalFinancialAdvisorPrompt(packet);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 1600,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const parsed = safeParse<any>(cleanResponseText(text), {});
    const normalizedStructured = normalizeStructuredResponse(parsed.structuredResponse || parsed, packet);
    const content =
      typeof parsed?.content === "string" && parsed.content.trim()
        ? parsed.content
        : normalizedStructured.answer || normalizedStructured.recommendedStrategy;

    return {
      content,
      structuredResponse: normalizedStructured,
      contextMeta: metadata,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      content: "I could not complete the analysis right now. Review the bill, EOB, and your payment options before making a payment.",
      structuredResponse: {
        answer: "I could not complete the analysis right now.",
        situationSummary: "The assistant could not finish building a reliable bill strategy response.",
        billAssessment: "Review the bill and confirm the balance before paying.",
        insuranceAssessment: "Check for a linked EOB or recent claim status update.",
        financialAssessment: "Use your current cash flow and HSA/FSA availability to avoid overcommitting.",
        recommendedStrategy: "Validate the bill and request an interest-free payment pause while reviewing.",
        strategyOptions: [],
        immediateNextSteps: [
          "Confirm the medical bill amount and due date.",
          "Check for a matching EOB or claim status.",
          "Ask the provider for a payment pause while the bill is reviewed.",
        ],
        documentsReferenced: [
          { id: "financial-profile", type: "financial_profile", label: "Financial profile snapshot" },
        ],
        assumptions: [],
        missingInformation: ["Assistant response generation failed."],
        confidenceLevel: "low",
        followUpQuestions: ["Do you want to review this bill against its EOB?", "Do you want a payment-plan recommendation instead?"],
      },
      contextMeta: metadata,
    };
  }
}

export async function analyzeMedicalDocument(text: string, csvHint?: string | null): Promise<any> {
  const systemPrompt = `You are a medical document analyzer for ClearPath.

Classify the uploaded content into exactly one of:
- "insurance_plan"
- "medical_bill"
- "eob"

Only reject the document if it is clearly unrelated to healthcare or insurance.

${csvHint ? `Strong hint: classify as "${csvHint}" unless the content clearly contradicts that.` : ""}

Extraction rules:

If the type is "insurance_plan", extract:
- planName
- network
- deductibleIndiv
- deductibleFamily
- oopMaxIndiv
- oopMaxFamily
- coinsuranceIn
- coinsuranceOut
- copays { primaryCare, specialist, urgentCare, emergencyRoom, telehealth }
- pharmacyBenefits {
    generic,
    preferred,
    nonPreferred,
    specialty,
    additionalDeductible,
    mailOrder,
    notes
  }
- coverageRules
- exclusions
- priorAuthRequired
- appealsRules
- billingProtectionRules
- negotiationRelevantRules
- sourceExcerpts (up to 5 short supporting snippets)

Insurance extraction requirements:
- Return numbers only for deductible, out-of-pocket max, coinsurance percentages, copays, and pharmacy numeric values.
- Never return formatted currency strings like "$6,350" or "$500 per Policy Year". Return 6350 and 500.
- If the text says "80% of preferred allowance", return 80 for coinsuranceIn.
- If the text says "Maximum out-of-pocket expenses per Policy Year $6,350 / $12,000 per family", return oopMaxIndiv=6350 and oopMaxFamily=12000.
- If the text says "Prescriptions - additional deductible per fill $30", set pharmacyBenefits.additionalDeductible=30.
- Treat sections labeled "pharmacy", "prescription", "prescriptions", "prescription drug", or "Rx" as pharmacy-benefit sections.
- If the plan uses prescription terminology instead of pharmacy terminology, still populate pharmacyBenefits from that section.
- If a value is not present, use 0 for numeric fields and empty string/empty array for text collections.

If the type is "medical_bill", extract:
- providerName
- accountNumber
- statementDate
- dueDate
- dateOfService
- dateOfServiceStart
- dateOfServiceEnd
- totalAmount
- currentBalance
- patientResponsibility
- careType
- inNetworkStatus
- lineItems
- paymentOptions
- financialAssistance
- discounts
- negotiationEligible
- charityCareEligible
- installmentPlanAvailable
- sourceExcerpts (up to 5 short supporting snippets)

If the type is "eob", extract:
- payerName
- claimNumber
- providerName
- patientName
- statementDate
- dateOfService
- dateOfServiceStart
- dateOfServiceEnd
- billedAmount
- allowedAmount
- planPaidAmount
- patientResponsibility
- deductibleApplied
- coinsuranceApplied
- copayApplied
- nonCoveredAmount
- outOfNetworkPenalty
- claimStatus
- denialReason
- sourceExcerpts (up to 5 short supporting snippets)

Return ONLY valid JSON:
{
  "isValid": true,
  "determinedType": "insurance_plan",
  "rejectionReason": null,
  "extractedData": {}
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text.slice(0, 18000) },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    return safeParse<any>(cleanResponseText(responseText), {
      isValid: false,
      determinedType: null,
      rejectionReason: "The analyzer returned invalid JSON.",
      extractedData: {},
    });
  } catch (error) {
    console.error("Error analyzing document:", error);
    return {
      isValid: false,
      determinedType: null,
      rejectionReason: "Failed to cleanly parse the document using AI.",
      extractedData: {},
    };
  }
}

export async function generateFinancialScenario(params: {
  procedureType: string;
  totalEstimatedCost: number;
  userResponsibility: number;
  hsaAvailable: number;
  monthlyIncome: number;
}): Promise<{
  hsaRecommended: number;
  monthlyImpactPercent: number;
  financialStrainLevel: "low" | "moderate" | "high";
  paymentScenarios: Array<{
    id: string;
    label: string;
    duration: string;
    monthlyAmount: number;
    totalCost: number;
    description: string;
  }>;
}> {
  const systemPrompt = `You are a highly empathetic healthcare financial advisor for ClearPath.

The user needs a medical procedure (${params.procedureType}).
Their total responsibility after insurance is $${params.userResponsibility.toFixed(2)}.
They have $${params.hsaAvailable.toFixed(2)} available in their Health Savings Account (HSA).
Their estimated monthly income is $${params.monthlyIncome.toFixed(2)} (or ~$${(params.monthlyIncome * 12).toLocaleString()} annually).

Your goal is to build a realistic, compassionate payment strategy that minimizes their financial strain while being practical.

STEP 1: Determine HSA Usage
Recommend how much of their HSA they should use upfront ("hsaRecommended"). If the responsibility is very high, avoid draining their HSA completely—leave them a small safety net if possible. However, if using the full HSA eliminates the debt, do that.

STEP 2: Strain Analysis
Calculate the "monthlyImpactPercent" (the likely monthly payment of the remaining balance as a percentage of their monthly income) and classify their "financialStrainLevel" (low, moderate, high) based on whether paying the remainder will severely disrupt their life.

STEP 3: Payment Scenarios
Generate EXACTLY 4 highly personalized payment plans ("paymentScenarios"). They MUST have the following exact keys to match the frontend UI:
- id (string, e.g., "ps-1")
- label (string, e.g., "HSA + Hospital Payment Plan", "Medical Financing", "Income-Driven Hardship Plan", "Pay in Full Discount")
- duration (string, e.g., "12 months", "Immediate", "24 months")
- monthlyAmount (number, how much they pay each month)
- totalCost (number, total cost including interest if applicable)
- description (string, exactly 1-2 brief empathetic sentences explaining why this strategy makes sense)

Return ONLY a raw JSON object with the following exact structure (no markdown tags):
{
  "hsaRecommended": number,
  "monthlyImpactPercent": number,
  "financialStrainLevel": "low" | "moderate" | "high",
  "paymentScenarios": [
    { "id": "...", "label": "...", "duration": "...", "monthlyAmount": number, "totalCost": number, "description": "..." }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the personalized financial scenario JSON now. Only return JSON." }
      ],
      temperature: 0.4,
    });
    
    let responseText = completion.choices[0]?.message?.content || "{}";
    if (responseText.startsWith("\`\`\`json")) {
      responseText = responseText.replace(/^\`\`\`json\s*/, "").replace(/\`\`\`\s*$/, "");
    } else if (responseText.startsWith("\`\`\`")) {
      responseText = responseText.replace(/^\`\`\`\s*/, "").replace(/\`\`\`\s*$/, "");
    }

    return JSON.parse(responseText.trim());
  } catch (error) {
    console.error("Error generating financial scenario:", error);
    // Fallback safe defaults if AI fails
    return {
      hsaRecommended: Math.min(params.hsaAvailable, params.userResponsibility),
      monthlyImpactPercent: 0,
      financialStrainLevel: "moderate",
      paymentScenarios: [
        {
          id: "ps-fallback",
          label: "Standard Payment Plan",
          duration: "12 months",
          monthlyAmount: params.userResponsibility / 12,
          totalCost: params.userResponsibility,
          description: "A standard 12-month payment plan. We recommend trying again later for personalized options."
        }
      ]
    };
  }
}


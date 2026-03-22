import OpenAI from "openai";
import { prisma } from "./db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

import fs from "fs";
import path from "path";

export async function getHealthcareSystemPrompt(): Promise<string> {
  // Load user's insurance plan for context
  const plan = await prisma.insurancePlan.findFirst();

  // Load the newest parsed document text to serve as ground-truth memory
  const latestDoc = await prisma.document.findFirst({
    where: { type: "insurance_plan", status: "ready" },
    orderBy: { uploadedAt: "desc" }
  });

  let documentContext = "";
  if (latestDoc && latestDoc.filePath) {
    try {
      const txtPath = path.join(process.cwd(), latestDoc.filePath + ".txt");
      if (fs.existsSync(txtPath)) {
        const rawText = fs.readFileSync(txtPath, "utf-8");
        // Limit context to 15,000 chars to avoid token explosion
        documentContext = `\n\n--- RAW INSURANCE DOCUMENT CONTEXT ---\nThe following is the actual unedited text extracted from the user's uploaded insurance document. Use this to definitively answer detailed coverage questions, copay questions, or rule questions.\nText:\n${rawText.substring(0, 15000)}\n----------------------------------------\n`;
      }
    } catch (e) {
      console.error("Failed to load document context from disk:", e);
    }
  }

  let planContext = "No insurance plan data available.";
  if (plan) {
    const copays = JSON.parse(plan.copays || "{}");
    planContext = `
User's Insurance Plan Summary:
- Plan: ${plan.name} (${plan.type})
- Network: ${plan.provider}
- Plan Year: ${plan.planYearStart} to ${plan.planYearEnd}
- Deductible: $${plan.deductibleIndiv} individual / $${plan.deductibleFamily} family
- Deductible Met: $${plan.deductibleMetIndiv} individual / $${plan.deductibleMetFamily} family
- Out-of-Pocket Max: $${plan.oopMaxIndiv} individual / $${plan.oopMaxFamily} family
- Out-of-Pocket Spent: $${plan.oopSpentIndiv} individual / $${plan.oopSpentFamily} family
- Coinsurance: ${plan.coinsuranceIn}% in-network / ${plan.coinsuranceOut}% out-of-network
- Copays: Primary Care $${copays.primaryCare || 0}, Specialist $${copays.specialist || 0}, Urgent Care $${copays.urgentCare || 0}, ER $${copays.emergencyRoom || 0}, Telehealth $${copays.telehealth || 0}
    `.trim();
  }

  return `You are a strict, highly accurate healthcare cost intelligence assistant for ClearPath.

CRITICAL INSTRUCTION: You MUST prioritize the "RAW INSURANCE DOCUMENT CONTEXT" block above everything else. The "User's Insurance Plan Summary" contains some baseline/mock application data (such as "Blue Cross Blue Shield", specific start dates, or specific dollars already spent). DO NOT quote these baseline providers, dates, or values back to the user unless they are explicitly grounded and found in the RAW text. If the raw text does not specify an insurance provider, say you don't know it. Only return information you got directly from the insurance document!

${planContext}${documentContext}

IMPORTANT: You must ALWAYS respond with a JSON object in this exact format (no markdown, no code blocks, just raw JSON):
{
  "content": "Your conversational response as a brief paragraph",
  "structuredResponse": {
    "recommendation": "Your specific recommendation based on the user's question and their plan",
    "coverageEstimate": "How their insurance plan covers this, with specific copay/coinsurance details",
    "expectedCost": { "low": <number>, "high": <number> },
    "financialImpact": "How this affects their overall financial situation (deductible progress, OOP, HSA)",
    "assumptions": ["assumption 1", "assumption 2", "assumption 3"],
    "confidenceLevel": "high" | "medium" | "low",
    "followUpQuestions": ["question 1", "question 2", "question 3"]
  }
}

Be specific, empathetic, and reference the user's actual plan details. Use real dollar amounts based on their coverage. If you don't have enough information, set confidenceLevel to "low" and explain what's missing in assumptions.`;
}

export async function chatWithGemini(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
): Promise<{
  content: string;
  structuredResponse?: {
    recommendation: string;
    coverageEstimate: string;
    expectedCost: { low: number; high: number };
    financialImpact: string;
    assumptions: string[];
    confidenceLevel: "high" | "medium" | "low";
    followUpQuestions: string[];
  };
}> {
  const systemPrompt = await getHealthcareSystemPrompt();

  // Build messages for OpenAI
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const text = completion.choices[0]?.message?.content || "";

    // Try to parse JSON from response (handle potential markdown wrapping)
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    try {
      const parsed = JSON.parse(cleanText);
      return {
        content: parsed.content || text,
        structuredResponse: parsed.structuredResponse || undefined,
      };
    } catch {
      // If JSON parsing fails, return as plain text
      return { content: text };
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
    };
  }
}

export async function analyzeMedicalDocument(text: string, csvHint?: string | null): Promise<any> {
  const systemPrompt = `You are a medical document analyzer and validator for ClearPath.
The user has uploaded a healthcare document.

STEP 1: CLASSIFICATION & VALIDATION
Carefully determine if the extracted text contains ANY relevant healthcare or insurance-related information. 
Only reject the document (isValid: false) if the text is CLEARLY unrelated to healthcare entirely (e.g., a food recipe, academic paper, tax form, or completely blank). If there is ANY plausible insurance/medical content, mark isValid: true.
If isValid is true, you MUST determine the document type (determinedType). It must be EXACTLY ONE of the following three strings:
- "insurance_plan" (Any plan coverage document, summary of benefits, ID card, insurance terms/rules)
- "medical_bill" (An invoice, hospital bill, or statement showing charges for a medical service rendered)
- "eob" (An Explanation of Benefits from an insurer showing what was claimed and patient responsibility)

${csvHint ? `CRITICAL SYSTEM INSTRUCTION: The uploaded file explicitly had "${csvHint === 'eob' ? 'EOB' : 'Medical Bill'}" in its top-most CSV row. Strongly prefer classifying it as "${csvHint}".` : ""}

Provide a rejectionReason ONLY if isValid is false. Keep it helpful and friendly.

STEP 2: EXTRACTION
Based on your determinedType, extract the following:
If "insurance_plan", you MUST extract these EXACT keys with numerical values (e.g. 50, not "$50"):
- planName (string, the name of the plan policy)
- network (string, the name of the insurance network, e.g. "Aetna PPO", "UnitedHealthcare", etc.)
- deductibleIndiv (number, individual deductible, 0 if not found)
- deductibleFamily (number, family deductible, 0 if not found)
- oopMaxIndiv (number, individual out-of-pocket max, 0 if not found)
- oopMaxFamily (number, family out-of-pocket max, 0 if not found)
- coinsuranceIn (number, in-network coinsurance percentage, 0 if not found)
- coinsuranceOut (number, out-of-network coinsurance percentage, 0 if not found)
- copays (object): MUST include these exact number fields: "primaryCare", "specialist", "urgentCare", "emergencyRoom", "telehealth".
- pharmacyBenefits (object): MUST include these exact number fields: "generic", "preferred", "nonPreferred", "specialty".
- coverageRules (array of strings): 3-5 key rules regarding general coverage constraints.
- exclusions (array of strings): 3-5 key things explicitly NOT covered.
- priorAuthRequired (array of strings): 3-5 services requiring prior authorization.

For Medical Bill or EOB:
- providerName
- dateOfService
- totalAmount (as a number)
- patientResponsibility (as a number)

Return ONLY raw JSON in this exact format (no markdown, no code blocks):
{
  "isValid": boolean,
  "determinedType": "insurance_plan" | "medical_bill" | "eob" | null,
  "rejectionReason": null or "string",
  "extractedData": { 
      // ONLY include properties from ABOVE based on document type
  }
}
If a numerical value cannot be found, use 0. If rules/exclusions cannot be found, return empty arrays.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.1,
    });
    
    let responseText = completion.choices[0]?.message?.content || "{}";
    if (responseText.startsWith("\`\`\`json")) {
      responseText = responseText.replace(/^\`\`\`json\s*/, "").replace(/\`\`\`\s*$/, "");
    } else if (responseText.startsWith("\`\`\`")) {
      responseText = responseText.replace(/^\`\`\`\s*/, "").replace(/\`\`\`\s*$/, "");
    }

    return JSON.parse(responseText.trim());
  } catch (error) {
    console.error("Error analyzing document:", error);
    return { isValid: false, rejectionReason: "Failed to cleanly parse the document using AI." };
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


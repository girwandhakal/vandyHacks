import OpenAI from "openai";
import { prisma } from "./db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function getHealthcareSystemPrompt(): Promise<string> {
  // Load user's insurance plan for context
  const plan = await prisma.insurancePlan.findFirst();

  let planContext = "No insurance plan data available.";
  if (plan) {
    const copays = JSON.parse(plan.copays);
    planContext = `
User's Insurance Plan:
- Plan: ${plan.name} (${plan.type})
- Provider: ${plan.provider}
- Plan Year: ${plan.planYearStart} to ${plan.planYearEnd}
- Deductible: $${plan.deductibleIndiv} individual / $${plan.deductibleFamily} family
- Deductible Met: $${plan.deductibleMetIndiv} individual / $${plan.deductibleMetFamily} family
- Out-of-Pocket Max: $${plan.oopMaxIndiv} individual / $${plan.oopMaxFamily} family
- Out-of-Pocket Spent: $${plan.oopSpentIndiv} individual / $${plan.oopSpentFamily} family
- Coinsurance: ${plan.coinsuranceIn}% in-network / ${plan.coinsuranceOut}% out-of-network
- Copays: Primary Care $${copays.primaryCare}, Specialist $${copays.specialist}, Urgent Care $${copays.urgentCare}, ER $${copays.emergencyRoom}, Telehealth $${copays.telehealth}
    `.trim();
  }

  return `You are a healthcare cost intelligence assistant for ClearPath. You help users understand their insurance coverage, estimate medical costs, and make informed healthcare decisions.

${planContext}

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

import { Conversation } from "@/types";

export const mockConversation: Conversation = {
  id: "conv-001",
  title: "Knee pain treatment options",
  createdAt: "2026-03-20T10:30:00Z",
  updatedAt: "2026-03-20T10:35:00Z",
  messages: [
    {
      id: "msg-1",
      role: "user",
      content: "I've been having knee pain for about two weeks. What are my care options and how much would they cost?",
      timestamp: "2026-03-20T10:30:00Z",
    },
    {
      id: "msg-2",
      role: "assistant",
      content: "Based on your symptoms and insurance coverage, here are your options for addressing knee pain that's lasted two weeks.",
      structuredResponse: {
        answer: "Start with telehealth or primary care before escalating to imaging.",
        situationSummary: "The user has persistent knee pain and wants a cost-aware care path.",
        billAssessment: "There is no bill yet, so this is a prospective care-planning question.",
        insuranceAssessment: "Telehealth is covered at a low copay and diagnostic imaging is likely subject to deductible and prior authorization rules.",
        financialAssessment: "This is a low-strain decision compared with a large medical bill because the likely near-term out-of-pocket cost is modest.",
        recommendedStrategy: "Use the lowest-cost clinically reasonable entry point first, then escalate only if needed.",
        strategyOptions: [
          {
            label: "Start with telehealth",
            recommended: true,
            feasibility: "high",
            monthlyCost: 15,
            totalCost: 15,
            pros: ["Low cost", "Fast access"],
            cons: ["May still need in-person follow-up"],
            requiredActions: ["Book a telehealth visit", "Escalate if symptoms persist"],
            whyItFitsUser: "It balances cost and speed well.",
          },
        ],
        immediateNextSteps: ["Book a telehealth or primary care visit", "Check if MRI would need prior authorization"],
        documentsReferenced: [
          { id: "insurance-plan", type: "insurance_plan", label: "ISO Student Insurance" },
          { id: "financial-profile", type: "financial_profile", label: "Financial profile snapshot" },
        ],
        assumptions: [
          "Using in-network providers",
          "Based on your current deductible progress (67% met)",
          "No prior authorization needed for initial consultation",
          "MRI cost estimate based on regional averages",
        ],
        missingInformation: [],
        confidenceLevel: "high",
        followUpQuestions: [
          "Should I compare telehealth vs in-person costs?",
          "What if I need physical therapy?",
          "Which in-network orthopedists are near me?",
          "How would this affect my deductible?",
        ],
      },
      timestamp: "2026-03-20T10:31:00Z",
    },
    {
      id: "msg-3",
      role: "user",
      content: "What if I need physical therapy?",
      timestamp: "2026-03-20T10:33:00Z",
    },
    {
      id: "msg-4",
      role: "assistant",
      content: "Physical therapy is well-covered under your plan. Here's what to expect.",
      structuredResponse: {
        answer: "Physical therapy is likely manageable if you stay in network.",
        situationSummary: "The user is evaluating the likely cost of a standard PT course.",
        billAssessment: "This is still prospective rather than a live bill review.",
        insuranceAssessment: "After deductible, in-network PT is expected to fall under coinsurance rather than a flat copay.",
        financialAssessment: "A typical PT course is moderate but likely manageable with current HSA funds.",
        recommendedStrategy: "Use in-network PT and spread visits across the standard care plan.",
        strategyOptions: [
          {
            label: "Use in-network PT",
            recommended: true,
            feasibility: "high",
            monthlyCost: 120,
            totalCost: 360,
            pros: ["Keeps insurance participation high", "Predictable spend"],
            cons: ["Requires repeated visits"],
            requiredActions: ["Choose an in-network therapist", "Confirm visit limits"],
            whyItFitsUser: "It keeps costs controlled while getting recommended care.",
          },
        ],
        immediateNextSteps: ["Confirm visit limits", "Verify in-network therapist availability"],
        documentsReferenced: [
          { id: "insurance-plan", type: "insurance_plan", label: "ISO Student Insurance" },
          { id: "financial-profile", type: "financial_profile", label: "Financial profile snapshot" },
        ],
        assumptions: [
          "Using in-network physical therapist",
          "Deductible will be met during treatment",
          "8-12 session standard course",
          "No specialized equipment needed",
        ],
        missingInformation: [],
        confidenceLevel: "medium",
        followUpQuestions: [
          "Show me in-network PT providers",
          "How do I use my HSA to pay?",
          "What if I also need an MRI first?",
          "Create a scenario plan for full treatment",
        ],
      },
      timestamp: "2026-03-20T10:34:00Z",
    },
  ],
};

export const mockSuggestedQuestions = [
  "What does my insurance cover for lab work?",
  "How much would an ER visit cost me?",
  "Am I close to meeting my deductible?",
  "Compare urgent care vs ER for a sprained ankle",
  "What preventive care is free under my plan?",
  "How do I submit a claim for reimbursement?",
];


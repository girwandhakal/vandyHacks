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
        recommendation: "Start with a telehealth consultation to assess severity. If imaging is needed, your doctor can order an X-ray or MRI. For persistent pain lasting 2+ weeks, a primary care visit is recommended as the next step.",
        coverageEstimate: "Your BCBS PPO Gold plan covers telehealth at $15 copay and primary care at $30 copay. If imaging is needed, it would apply to your deductible (67% met). Physical therapy is covered at 80% after deductible.",
        expectedCost: { low: 15, high: 350 },
        financialImpact: "Low impact. A telehealth visit costs $15. Even if an MRI is needed ($200-350 after your deductible progress), you have remaining deductible capacity and your HSA balance of $1,850 can cover it.",
        assumptions: [
          "Using in-network providers",
          "Based on your current deductible progress (67% met)",
          "No prior authorization needed for initial consultation",
          "MRI cost estimate based on regional averages",
        ],
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
        recommendation: "Your plan covers up to 30 physical therapy visits per year. At your current deductible progress, most of the cost will be covered by insurance at 80% coinsurance. A typical PT course is 8-12 sessions.",
        coverageEstimate: "After deductible: you pay 20% coinsurance. Average PT session costs $75-150. Your share per session would be approximately $15-30 after insurance.",
        expectedCost: { low: 120, high: 360 },
        financialImpact: "Moderate but manageable. A 12-session PT course would cost $180-360 out of pocket. This is well within your HSA balance and your remaining out-of-pocket capacity.",
        assumptions: [
          "Using in-network physical therapist",
          "Deductible will be met during treatment",
          "8-12 session standard course",
          "No specialized equipment needed",
        ],
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

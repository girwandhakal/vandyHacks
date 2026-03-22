import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // --- User ---
  const user = await prisma.user.create({
    data: {
      id: "user-001",
      name: "Alex Morgan",
      email: "alex.morgan@email.com",
      preferences: JSON.stringify({
        notifications: true,
        emailDigest: false,
        darkMode: false,
        currency: "USD",
      }),
    },
  });
  console.log("  ✅ User created");

  // --- Connected Accounts ---
  await prisma.connectedAccount.createMany({
    data: [
      { id: "acc-1", type: "insurance", label: "Blue Cross Blue Shield", status: "connected", lastSync: new Date("2026-03-21T08:00:00Z"), userId: user.id },
      { id: "acc-2", type: "bank", label: "Chase Checking ••4821", status: "connected", lastSync: new Date("2026-03-20T22:00:00Z"), userId: user.id },
      { id: "acc-3", type: "hsa", label: "Fidelity HSA", status: "connected", lastSync: new Date("2026-03-19T12:00:00Z"), userId: user.id },
      { id: "acc-4", type: "fsa", label: "FSA Account", status: "disconnected", userId: user.id },
    ],
  });
  console.log("  ✅ Connected accounts created");

  // --- Insurance Plan ---
  await prisma.insurancePlan.create({
    data: {
      id: "plan-001",
      name: "Blue Cross Blue Shield PPO Gold",
      provider: "Blue Cross Blue Shield",
      type: "PPO",
      planYearStart: "2026-01-01",
      planYearEnd: "2026-12-31",
      deductibleIndiv: 2000,
      deductibleFamily: 4000,
      deductibleMetIndiv: 0,
      deductibleMetFamily: 0,
      oopMaxIndiv: 6500,
      oopMaxFamily: 13000,
      oopSpentIndiv: 0,
      oopSpentFamily: 0,
      coinsuranceIn: 80,
      coinsuranceOut: 60,
      copays: JSON.stringify({
        primaryCare: 30,
        specialist: 50,
        urgentCare: 75,
        emergencyRoom: 250,
        telehealth: 15,
      }),
      pharmacyBenefits: JSON.stringify({
        generic: 10,
        preferred: 35,
        nonPreferred: 70,
        specialty: "30% after deductible",
        mailOrder: "2x copay for 90-day supply",
      }),
      coverageRules: JSON.stringify([
        "Preventive care covered at 100% in-network",
        "Referral not required for specialists",
        "Out-of-network care subject to balance billing",
        "Mental health parity with medical benefits",
        "Telehealth visits covered at in-network rates",
      ]),
      exclusions: JSON.stringify([
        "Cosmetic surgery (non-reconstructive)",
        "Experimental or investigational treatments",
        "Long-term custodial care",
        "Services not deemed medically necessary",
      ]),
      priorAuthRequired: JSON.stringify([
        "Inpatient hospital stays",
        "Advanced imaging (MRI, CT, PET)",
        "Outpatient surgery",
        "Specialty medications",
        "Durable medical equipment over $500",
      ]),
    },
  });
  console.log("  ✅ Insurance plan created");

  // --- Care Reminders ---
  await prisma.careReminder.createMany({
    data: [
      { id: "rem-1", title: "Annual physical exam", date: "2026-04-15", type: "Preventive", status: "upcoming" },
      { id: "rem-2", title: "Dental cleaning", date: "2026-03-10", type: "Dental", status: "overdue" },
      { id: "rem-3", title: "Prescription refill — Lisinopril", date: "2026-03-28", type: "Pharmacy", status: "upcoming" },
      { id: "rem-4", title: "Eye exam", date: "2026-02-20", type: "Vision", status: "completed" },
    ],
  });
  console.log("  ✅ Care reminders created");

  // --- Recent Activity ---
  await prisma.activity.createMany({
    data: [
      { id: "act-1", label: "Uploaded insurance card", time: "2 hours ago", icon: "FileUp" },
      { id: "act-2", label: "Cost estimate: Dermatology visit", time: "Yesterday", icon: "Calculator" },
      { id: "act-3", label: "AI chat: Knee pain options", time: "2 days ago", icon: "MessageSquare" },
      { id: "act-4", label: "Reviewed EOB from Dr. Martinez", time: "3 days ago", icon: "FileText" },
    ],
  });
  console.log("  ✅ Activities created");

  // --- Documents ---
  await prisma.document.createMany({
    data: [
      {
        id: "doc-1", name: "BCBS_PPO_Gold_2026_Summary.pdf", type: "insurance_plan", status: "ready",
        fileSize: "2.4 MB", uploadedAt: new Date("2026-02-15T09:00:00Z"),
        extractedData: JSON.stringify({ planName: "Blue Cross Blue Shield PPO Gold", deductible: 2000, outOfPocketMax: 6500, coverage: "Comprehensive medical, dental, vision" }),
      },
      {
        id: "doc-2", name: "EOB_Dr_Martinez_Feb2026.pdf", type: "eob", status: "ready",
        fileSize: "856 KB", uploadedAt: new Date("2026-03-05T14:30:00Z"),
        extractedData: JSON.stringify({ planName: "BCBS PPO Gold", deductible: 185, outOfPocketMax: 37, coverage: "Office visit — Primary Care" }),
      },
      {
        id: "doc-3", name: "Lab_Invoice_Quest_Mar2026.pdf", type: "medical_bill", status: "analyzing",
        fileSize: "1.1 MB", uploadedAt: new Date("2026-03-18T11:15:00Z"),
      },
      {
        id: "doc-4", name: "MRI_Estimate_RadiologyGroup.pdf", type: "estimate", status: "ready",
        fileSize: "420 KB", uploadedAt: new Date("2026-03-19T16:45:00Z"),
        extractedData: JSON.stringify({ planName: "BCBS PPO Gold", deductible: 850, outOfPocketMax: 170, coverage: "Diagnostic imaging — MRI knee" }),
      },
      {
        id: "doc-5", name: "Prescription_Summary_Q1.pdf", type: "medical_bill", status: "error",
        fileSize: "310 KB", uploadedAt: new Date("2026-03-20T08:00:00Z"),
      },
      {
        id: "doc-6", name: "Urgent_Care_Bill.pdf", type: "medical_bill", status: "ready",
        fileSize: "1.2 MB", uploadedAt: new Date("2026-03-22T09:00:00Z"),
        extractedData: JSON.stringify({ totalAmount: 40, patientResponsibility: 40 }),
      },
      {
        id: "doc-7", name: "EOB_Urgent_Care.pdf", type: "eob", status: "ready",
        linkedBillId: "doc-6",
        fileSize: "600 KB", uploadedAt: new Date("2026-03-23T10:00:00Z"),
        extractedData: JSON.stringify({ patientResponsibility: 40, deductibleApplied: 40 }),
      },
      {
        id: "doc-8", name: "Surgery_Center_Bill.pdf", type: "medical_bill", status: "ready",
        fileSize: "3.5 MB", uploadedAt: new Date("2026-03-24T11:00:00Z"),
        extractedData: JSON.stringify({ totalAmount: 2500, patientResponsibility: 2500 }),
      },
      {
        id: "doc-9", name: "EOB_Surgery_Center.pdf", type: "eob", status: "ready",
        linkedBillId: "doc-8",
        fileSize: "1.0 MB", uploadedAt: new Date("2026-03-25T14:30:00Z"),
        extractedData: JSON.stringify({ patientResponsibility: 2500, deductibleApplied: 2500 }),
      },
    ],
  });
  console.log("  ✅ Documents created");

  // --- Conversation + Messages ---
  const conv = await prisma.conversation.create({
    data: {
      id: "conv-001",
      title: "Knee pain treatment options",
      userId: user.id,
      createdAt: new Date("2026-03-20T10:30:00Z"),
      updatedAt: new Date("2026-03-20T10:35:00Z"),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        id: "msg-1", role: "user",
        content: "I've been having knee pain for about two weeks. What are my care options and how much would they cost?",
        conversationId: conv.id, timestamp: new Date("2026-03-20T10:30:00Z"),
      },
      {
        id: "msg-2", role: "assistant",
        content: "Based on your symptoms and insurance coverage, here are your options for addressing knee pain that's lasted two weeks.",
        structuredResponse: JSON.stringify({
          recommendation: "Start with a telehealth consultation to assess severity. If imaging is needed, your doctor can order an X-ray or MRI. For persistent pain lasting 2+ weeks, a primary care visit is recommended as the next step.",
          coverageEstimate: "Your BCBS PPO Gold plan covers telehealth at $15 copay and primary care at $30 copay. If imaging is needed, it would apply to your deductible (67% met). Physical therapy is covered at 80% after deductible.",
          expectedCost: { low: 15, high: 350 },
          financialImpact: "Low impact. A telehealth visit costs $15. Even if an MRI is needed ($200-350 after your deductible progress), you have remaining deductible capacity and your HSA balance of $1,850 can cover it.",
          assumptions: ["Using in-network providers", "Based on your current deductible progress (67% met)", "No prior authorization needed for initial consultation", "MRI cost estimate based on regional averages"],
          confidenceLevel: "high",
          followUpQuestions: ["Should I compare telehealth vs in-person costs?", "What if I need physical therapy?", "Which in-network orthopedists are near me?", "How would this affect my deductible?"],
        }),
        conversationId: conv.id, timestamp: new Date("2026-03-20T10:31:00Z"),
      },
      {
        id: "msg-3", role: "user",
        content: "What if I need physical therapy?",
        conversationId: conv.id, timestamp: new Date("2026-03-20T10:33:00Z"),
      },
      {
        id: "msg-4", role: "assistant",
        content: "Physical therapy is well-covered under your plan. Here's what to expect.",
        structuredResponse: JSON.stringify({
          recommendation: "Your plan covers up to 30 physical therapy visits per year. At your current deductible progress, most of the cost will be covered by insurance at 80% coinsurance. A typical PT course is 8-12 sessions.",
          coverageEstimate: "After deductible: you pay 20% coinsurance. Average PT session costs $75-150. Your share per session would be approximately $15-30 after insurance.",
          expectedCost: { low: 120, high: 360 },
          financialImpact: "Moderate but manageable. A 12-session PT course would cost $180-360 out of pocket. This is well within your HSA balance and your remaining out-of-pocket capacity.",
          assumptions: ["Using in-network physical therapist", "Deductible will be met during treatment", "8-12 session standard course", "No specialized equipment needed"],
          confidenceLevel: "medium",
          followUpQuestions: ["Show me in-network PT providers", "How do I use my HSA to pay?", "What if I also need an MRI first?", "Create a scenario plan for full treatment"],
        }),
        conversationId: conv.id, timestamp: new Date("2026-03-20T10:34:00Z"),
      },
    ],
  });
  console.log("  ✅ Conversation + messages created");

  // --- Insights ---
  await prisma.insight.createMany({
    data: [
      { id: "ins-1", title: "You've met 67% of your deductible", description: "You're on track to meet your full deductible by Q3. Consider scheduling deferred procedures now to maximize insurance coverage this year.", category: "timing", priority: "high", actionLabel: "View deductible progress", icon: "TrendingUp" },
      { id: "ins-2", title: "Telehealth saves on low-acuity visits", description: "For your upcoming dermatology consultation, telehealth could save you $35 compared to an in-office visit with similar outcomes.", category: "savings", priority: "high", actionLabel: "Compare options", icon: "DollarSign" },
      { id: "ins-3", title: "Use HSA funds before year-end", description: "Your HSA balance of $1,850 rolls over, but consider using it for planned expenses to reduce taxable income impact now.", category: "savings", priority: "medium", actionLabel: "View HSA details", icon: "Wallet" },
      { id: "ins-4", title: "Preventive care is 100% covered", description: "Your annual physical, flu shot, and standard screenings are fully covered with no copay. Schedule before Q2.", category: "coverage", priority: "medium", actionLabel: "Schedule care", icon: "ShieldCheck" },
      { id: "ins-5", title: "Medical spending trending up", description: "Your monthly healthcare spending increased 12% compared to last quarter. This is primarily driven by specialist visits.", category: "spending", priority: "low", actionLabel: "View spending trend", icon: "BarChart3" },
      { id: "ins-6", title: "Verify provider network before booking", description: "The specialist your doctor referred you to may be out-of-network. Verify to avoid surprise costs up to 40% more.", category: "network", priority: "high", actionLabel: "Check network status", icon: "AlertTriangle" },
      { id: "ins-7", title: "Prior authorization needed for MRI", description: "Your plan requires prior authorization for advanced imaging. Request this from your doctor to avoid claim denial.", category: "action", priority: "high", actionLabel: "Learn more", icon: "ClipboardCheck" },
      { id: "ins-8", title: "Mail-order Rx saves on refills", description: "Switching your Lisinopril to mail-order pharmacy (90-day supply) could save $15/quarter compared to retail pharmacy.", category: "savings", priority: "low", actionLabel: "Compare pharmacy options", icon: "Pill" },
    ],
  });
  console.log("  ✅ Insights created");

  // --- Scenario ---
  await prisma.scenario.create({
    data: {
      id: "scenario-001",
      name: "Knee Arthroscopy",
      procedureType: "Outpatient Surgery",
      totalEstimatedCost: 12500,
      insurancePortion: 9200,
      userResponsibility: 3300,
      hsaAvailable: 1850,
      hsaRecommended: 1850,
      paymentPlanMonths: 12,
      monthlyPayment: 121,
      financingAPR: 9.9,
      financingMonthly: 143,
      monthlyImpactPercent: 4.2,
      financialStrainLevel: "moderate",
      paymentScenarios: JSON.stringify([
        { id: "ps-1", label: "Pay with HSA + Monthly Plan", monthlyAmount: 121, totalCost: 3300, duration: "12 months", description: "Use $1,850 from HSA, then pay $121/mo for 12 months. No interest." },
        { id: "ps-2", label: "Full HSA + Shorter Plan", monthlyAmount: 242, totalCost: 3300, duration: "6 months", description: "Use $1,850 from HSA, then pay $242/mo for 6 months. Fastest payoff." },
        { id: "ps-3", label: "Medical Financing", monthlyAmount: 143, totalCost: 3630, duration: "24 months", description: "Finance full amount at 9.9% APR. Total cost is $330 more but lower monthly payments." },
        { id: "ps-4", label: "Pay in Full", monthlyAmount: 3300, totalCost: 3300, duration: "Immediate", description: "Pay entire balance upfront. May be able to negotiate 5-10% discount." },
      ]),
    },
  });
  console.log("  ✅ Scenario created");

  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

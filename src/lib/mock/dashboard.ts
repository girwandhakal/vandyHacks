import { DashboardAlert, QuickAction, CareReminder } from "@/types";

export const mockAlerts: DashboardAlert[] = [
  {
    id: "alert-1",
    title: "Deductible Progress",
    description: "You've met 67% of your individual deductible. Consider scheduling deferred care.",
    type: "info",
    actionLabel: "View details",
  },
  {
    id: "alert-2",
    title: "New EOB Available",
    description: "An Explanation of Benefits from your Feb 28 visit is ready to review.",
    type: "action",
    actionLabel: "Review now",
  },
  {
    id: "alert-3",
    title: "Potential Savings Found",
    description: "Telehealth could save you $45 on your upcoming dermatology consultation.",
    type: "success",
    actionLabel: "Compare options",
  },
];

export const mockQuickActions: QuickAction[] = [
  { id: "qa-1", label: "Estimate a cost", icon: "Calculator", href: "/cost-estimator" },
  { id: "qa-2", label: "Ask AI assistant", icon: "MessageSquare", href: "/assistant" },
  { id: "qa-3", label: "Upload document", icon: "Upload", href: "/documents" },
  { id: "qa-4", label: "View insurance", icon: "Shield", href: "/insurance" },
  { id: "qa-5", label: "Plan a scenario", icon: "GitBranch", href: "/scenarios" },
  { id: "qa-6", label: "View insights", icon: "Lightbulb", href: "/insights" },
];

export const mockReminders: CareReminder[] = [
  {
    id: "rem-1",
    title: "Annual physical exam",
    date: "2026-04-15",
    type: "Preventive",
    status: "upcoming",
  },
  {
    id: "rem-2",
    title: "Dental cleaning",
    date: "2026-03-10",
    type: "Dental",
    status: "overdue",
  },
  {
    id: "rem-3",
    title: "Prescription refill — Lisinopril",
    date: "2026-03-28",
    type: "Pharmacy",
    status: "upcoming",
  },
  {
    id: "rem-4",
    title: "Eye exam",
    date: "2026-02-20",
    type: "Vision",
    status: "completed",
  },
];

export const mockFinancialSnapshot = {
  monthlySpending: 342,
  monthlyBudget: 500,
  ytdSpending: 2180,
  trendDirection: "up" as const,
  trendPercent: 12,
  hsaBalance: 1850,
  fsaBalance: 0,
  savingsOpportunities: 3,
};

export const mockRecentActivity = [
  { id: "act-1", label: "Uploaded insurance card", time: "2 hours ago", icon: "FileUp" },
  { id: "act-2", label: "Cost estimate: Dermatology visit", time: "Yesterday", icon: "Calculator" },
  { id: "act-3", label: "AI chat: Knee pain options", time: "2 days ago", icon: "MessageSquare" },
  { id: "act-4", label: "Reviewed EOB from Dr. Martinez", time: "3 days ago", icon: "FileText" },
];

"use client";

import { AnimateIn } from "@/components/shared/animate-in";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { mockInsights } from "@/lib/mock/insights";
import {
  TrendingUp,
  DollarSign,
  Wallet,
  ShieldCheck,
  BarChart3,
  AlertTriangle,
  ClipboardCheck,
  Pill,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import type { InsightCategory } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  TrendingUp, DollarSign, Wallet, ShieldCheck, BarChart3,
  AlertTriangle, ClipboardCheck, Pill, Lightbulb,
};

const categoryLabels: Record<InsightCategory, string> = {
  savings: "Savings",
  timing: "Timing",
  coverage: "Coverage",
  spending: "Spending",
  network: "Network",
  action: "Action Required",
};

const categoryVariants: Record<InsightCategory, "accent" | "success" | "warning" | "danger" | "neutral"> = {
  savings: "success",
  timing: "accent",
  coverage: "accent",
  spending: "warning",
  network: "danger",
  action: "warning",
};

const priorityOrder = { high: 0, medium: 1, low: 2 };

export default function InsightsPage() {
  const sorted = [...mockInsights].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const highPriority = sorted.filter((i) => i.priority === "high");
  const otherPriority = sorted.filter((i) => i.priority !== "high");

  return (
    <div className="page-container">
      <AnimateIn>
        <PageHeader
          title="Insights & Recommendations"
          subtitle={`${highPriority.length} high-priority items need attention`}
        />
      </AnimateIn>

      {/* High priority section */}
      {highPriority.length > 0 && (
        <AnimateIn delay={0.05}>
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-4">
              Priority Actions
            </h2>
            <div className="space-y-3">
              {highPriority.map((insight, idx) => {
                const Icon = iconMap[insight.icon] || Lightbulb;
                return (
                  <AnimateIn key={insight.id} delay={0.05 + idx * 0.03}>
                    <div className="card-base group cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-warning-muted flex items-center justify-center flex-shrink-0">
                          <Icon size={18} className="text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-charcoal">{insight.title}</h3>
                            <StatusBadge
                              label={categoryLabels[insight.category]}
                              variant={categoryVariants[insight.category]}
                            />
                          </div>
                          <p className="text-sm text-neutral-500 leading-relaxed">
                            {insight.description}
                          </p>
                        </div>
                        {insight.actionLabel && (
                          <button className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-light transition-colors whitespace-nowrap mt-1">
                            {insight.actionLabel}
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </AnimateIn>
                );
              })}
            </div>
          </div>
        </AnimateIn>
      )}

      {/* Other insights */}
      <AnimateIn delay={0.15}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-4">
          More Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherPriority.map((insight, idx) => {
            const Icon = iconMap[insight.icon] || Lightbulb;
            return (
              <AnimateIn key={insight.id} delay={0.15 + idx * 0.03}>
                <div className="card-base group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-charcoal">{insight.title}</h3>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">{insight.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge
                          label={categoryLabels[insight.category]}
                          variant={categoryVariants[insight.category]}
                        />
                        <StatusBadge label={insight.priority} variant="neutral" />
                      </div>
                    </div>
                  </div>
                  {insight.actionLabel && (
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <button className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-light transition-colors">
                        {insight.actionLabel}
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </AnimateIn>
            );
          })}
        </div>
      </AnimateIn>
    </div>
  );
}

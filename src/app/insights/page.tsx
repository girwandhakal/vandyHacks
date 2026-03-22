"use client";

import { useState, useEffect } from "react";
import { AnimateIn } from "@/components/shared/animate-in";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/shared/skeleton";
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

const iconMap: Record<string, React.ElementType> = {
  TrendingUp, DollarSign, Wallet, ShieldCheck, BarChart3,
  AlertTriangle, ClipboardCheck, Pill, Lightbulb,
};

const categoryLabels: Record<string, string> = {
  savings: "Savings",
  timing: "Timing",
  coverage: "Coverage",
  spending: "Spending",
  network: "Network",
  action: "Action Required",
};

const categoryVariants: Record<string, "accent" | "success" | "warning" | "danger" | "neutral"> = {
  savings: "success",
  timing: "accent",
  coverage: "accent",
  spending: "warning",
  network: "danger",
  action: "warning",
};

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function InsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/insights')
      .then(res => res.json())
      .then(data => {
        if (active) {
          setInsights(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to fetch insights", err);
        if (active) setLoading(false);
      });
      
    return () => { active = false; };
  }, []);

  const sorted = [...insights].sort(
    (a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
  );

  const highPriority = sorted.filter((i) => i.priority === "high");
  const otherPriority = sorted.filter((i) => i.priority !== "high");

  return (
    <div className="page-container">
      <AnimateIn>
        <PageHeader
          title="Insights & Recommendations"
          subtitle={
            loading 
              ? "Analyzing your healthcare profile..." 
              : `${highPriority.length} high-priority items need attention`
          }
        />
      </AnimateIn>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      ) : insights.length === 0 ? (
        <div className="card-base py-12 text-center">
          <p className="text-neutral-500">No active insights at the moment. You're doing great!</p>
        </div>
      ) : (
        <>
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
                      <div key={insight.id} className="card-base group cursor-pointer mb-3">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-warning-muted flex items-center justify-center flex-shrink-0">
                            <Icon size={18} className="text-warning" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-charcoal">{insight.title}</h3>
                              <StatusBadge
                                label={categoryLabels[insight.category] || "Tip"}
                                variant={categoryVariants[insight.category] || "neutral"}
                              />
                            </div>
                            <p className="text-sm text-neutral-500 leading-relaxed">
                              {insight.description}
                            </p>
                            {insight.actionLabel && (
                              <button className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-light transition-colors whitespace-nowrap mt-2">
                                {insight.actionLabel}
                                <ArrowRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </AnimateIn>
          )}

          {/* Other insights */}
          {otherPriority.length > 0 && (
            <AnimateIn delay={0.15}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-4">
                More Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherPriority.map((insight, idx) => {
                  const Icon = iconMap[insight.icon] || Lightbulb;
                  return (
                    <AnimateIn key={insight.id} delay={0.15 + idx * 0.03}>
                      <div className="card-base group cursor-pointer h-full flex flex-col">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center flex-shrink-0">
                            <Icon size={16} className="text-neutral-500" />
                          </div>
                          <div className="flex-1 min-w-0 mb-4">
                            <div className="flexitems-center gap-2 mb-1">
                              <h3 className="text-sm font-medium text-charcoal">{insight.title}</h3>
                            </div>
                            <p className="text-xs text-neutral-500 leading-relaxed">{insight.description}</p>
                            <div className="mt-3 flex items-center gap-2">
                              <StatusBadge
                                label={categoryLabels[insight.category] || "Tip"}
                                variant={categoryVariants[insight.category] || "neutral"}
                              />
                              <StatusBadge label={insight.priority} variant="neutral" />
                            </div>
                          </div>
                        </div>
                        {insight.actionLabel && (
                          <div className="mt-auto pt-3 border-t border-neutral-100">
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
          )}
        </>
      )}
    </div>
  );
}

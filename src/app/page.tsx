"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimateIn } from "@/components/shared/animate-in";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/shared/skeleton";
import {
  Calculator,
  MessageSquare,
  Upload,
  Shield,
  GitBranch,
  Lightbulb,
  FileUp,
  FileText,
  ArrowRight,
  Wallet,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Calculator, MessageSquare, Upload, Shield, GitBranch, Lightbulb,
  FileUp, FileText, Wallet, TrendingUp,
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="page-container space-y-8">
        <Skeleton className="h-20 w-3/4" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const { greeting, currentMonth, alerts, insurance: plan, financialSnapshot, upcomingReminders, recentActivity } = data;

  const mockQuickActions = [
    { id: "1", label: "Estimate Cost", icon: "Calculator", href: "/cost-estimator" },
    { id: "2", label: "Ask AI", icon: "MessageSquare", href: "/assistant" },
    { id: "3", label: "Upload Bill", icon: "Upload", href: "/documents" },
    { id: "4", label: "Coverage", icon: "Shield", href: "/insurance" },
    { id: "5", label: "Scenarios", icon: "GitBranch", href: "/scenarios" },
    { id: "6", label: "Insights", icon: "Lightbulb", href: "/insights" },
  ];

  return (
    <div className="page-container">
      <AnimateIn>
        <PageHeader
          title={greeting}
          subtitle={`Here's your healthcare financial snapshot for ${currentMonth}`}
        />
      </AnimateIn>

      {/* Alerts */}
      <AnimateIn delay={0.05}>
        <div className="space-y-2 mb-8">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 bg-white"
            >
              <div className="mt-0.5">
                {alert.type === "success" && <Sparkles size={16} className="text-success" />}
                {alert.type === "info" && <Info size={16} className="text-accent" />}
                {alert.type === "warning" && <AlertCircle size={16} className="text-warning" />}
                {alert.type === "action" && <FileText size={16} className="text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">{alert.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{alert.description}</p>
              </div>
              {alert.actionLabel && (
                <button className="text-xs font-medium text-accent hover:text-accent-light transition-colors whitespace-nowrap">
                  {alert.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </AnimateIn>

      {/* Deductible & OOP Progress */}
      <AnimateIn delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="card-base flex items-center gap-6">
            <ProgressRing
              value={plan.deductibleMetIndiv}
              max={plan.deductibleIndiv}
              size={100}
              strokeWidth={8}
            />
            <div>
              <p className="text-sm text-neutral-500">Individual Deductible</p>
              <p className="text-xl font-semibold">
                {formatCurrency(plan.deductibleMetIndiv)}{" "}
                <span className="text-sm font-normal text-neutral-400">
                  of {formatCurrency(plan.deductibleIndiv)}
                </span>
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {formatCurrency(plan.deductibleIndiv - plan.deductibleMetIndiv)} remaining
              </p>
              <StatusBadge
                label={`${plan.deductiblePercent}% met`}
                variant={plan.deductiblePercent >= 80 ? "danger" : plan.deductiblePercent >= 50 ? "warning" : "accent"}
                className="mt-2"
              />
            </div>
          </div>

          <div className="card-base flex items-center gap-6">
            <ProgressRing
              value={plan.oopSpentIndiv}
              max={plan.oopMaxIndiv}
              size={100}
              strokeWidth={8}
            />
            <div>
              <p className="text-sm text-neutral-500">Out-of-Pocket Max</p>
              <p className="text-xl font-semibold">
                {formatCurrency(plan.oopSpentIndiv)}{" "}
                <span className="text-sm font-normal text-neutral-400">
                  of {formatCurrency(plan.oopMaxIndiv)}
                </span>
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {formatCurrency(plan.oopMaxIndiv - plan.oopSpentIndiv)} remaining
              </p>
              <StatusBadge
                label={`${plan.oopPercent}% used`}
                variant={plan.oopPercent >= 80 ? "danger" : plan.oopPercent >= 50 ? "warning" : "accent"}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </AnimateIn>

      {/* Financial Snapshot Row */}
      <AnimateIn delay={0.15}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Year-to-Date"
            value={formatCurrency(financialSnapshot.ytdSpending)}
            subtitle="Total out-of-pocket"
            trend={{ direction: "up", value: "2%" }}
          />
          <StatCard
            label="HSA Balance"
            value={formatCurrency(financialSnapshot.hsaBalance)}
            subtitle="Available funds"
            icon={<Wallet size={18} />}
          />
          <StatCard
            label="Care Reminders"
            value={String(upcomingReminders.length)}
            subtitle="Actionable items"
            icon={<Calendar size={18} />}
          />
          <StatCard
            label="Recent Activity"
            value={String(recentActivity.length)}
            subtitle="In the last 30 days"
            icon={<Clock size={18} />}
          />
        </div>
      </AnimateIn>

      {/* Quick Actions */}
      <AnimateIn delay={0.2}>
        <div className="mb-8">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {mockQuickActions.map((action) => {
              const Icon = iconMap[action.icon] || Calculator;
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className="card-base flex flex-col items-center gap-2.5 py-5 text-center group"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-500 group-hover:bg-charcoal group-hover:text-white transition-colors duration-200">
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-medium text-neutral-600">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </AnimateIn>

      {/* AI Assistant Entry + Care Reminders */}
      <AnimateIn delay={0.25}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* AI Assistant Card */}
          <Link href="/assistant" className="card-base group flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
                  <MessageSquare size={16} className="text-accent" />
                </div>
                <h3 className="section-title">AI Assistant</h3>
              </div>
              <p className="text-sm text-neutral-500 mb-4">
                Ask about symptoms, care costs, coverage details, or compare treatment options.
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-neutral-50 group-hover:bg-charcoal group-hover:text-white transition-colors duration-200">
              <MessageSquare size={14} />
              <span className="text-sm">Ask a question about your healthcare costs...</span>
              <ArrowRight size={14} className="ml-auto" />
            </div>
          </Link>

          {/* Upcoming Care */}
          <div className="card-base">
            <h3 className="section-title mb-4">Upcoming Care</h3>
            {upcomingReminders.length === 0 ? (
              <p className="text-sm text-neutral-500">No upcoming care reminders.</p>
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map((reminder: any) => (
                  <div key={reminder.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {reminder.status === "completed" && <CheckCircle2 size={16} className="text-success" />}
                      {reminder.status === "overdue" && <AlertCircle size={16} className="text-danger" />}
                      {reminder.status === "upcoming" && <Calendar size={16} className="text-neutral-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal">{reminder.title}</p>
                      <p className="text-xs text-neutral-400">{reminder.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">
                        {new Date(reminder.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      <StatusBadge
                        label={reminder.status}
                        variant={
                          reminder.status === "completed" ? "success" :
                          reminder.status === "overdue" ? "danger" : "neutral"
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AnimateIn>

      {/* Recent Activity + Insurance Status */}
      <AnimateIn delay={0.3}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Activity */}
          <div className="card-base">
            <h3 className="section-title mb-4">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-neutral-500">No recent activity.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity: any) => {
                  const Icon = iconMap[activity.icon] || FileText;
                  return (
                    <div key={activity.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center">
                        <Icon size={14} className="text-neutral-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-charcoal truncate">{activity.label}</p>
                      </div>
                      <span className="text-xs text-neutral-400 whitespace-nowrap flex items-center gap-1">
                        <Clock size={12} /> {activity.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Insurance Status */}
          <Link href="/insurance" className="card-base group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Insurance Plan</h3>
              <ArrowRight size={16} className="text-neutral-400 group-hover:text-charcoal transition-colors" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Plan</span>
                <span className="text-sm font-medium">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Type</span>
                <StatusBadge label={plan.type} variant="accent" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Coinsurance</span>
                <span className="text-sm font-medium">{plan.coinsuranceIn}% in-network</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">PCP Copay</span>
                <span className="text-sm font-medium">
                  {formatCurrency(JSON.parse(plan.copays || "{}").primaryCare || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Telehealth</span>
                <span className="text-sm font-medium">
                  {formatCurrency(JSON.parse(plan.copays || "{}").telehealth || 0)}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </AnimateIn>
    </div>
  );
}

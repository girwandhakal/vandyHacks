"use client";

import { useState, useEffect } from "react";
import { AnimateIn } from "@/components/shared/animate-in";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Skeleton } from "@/components/shared/skeleton";
import { formatCurrency } from "@/lib/utils";
import { mockProcedures } from "@/lib/mock/scenarios";
import {
  Search,
  Wallet,
  CreditCard,
  Landmark,
  Banknote,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";

export default function ScenariosPage() {
  const [selectedProcedure, setSelectedProcedure] = useState(mockProcedures[0]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ procedureType: selectedProcedure }),
    })
      .then(res => res.json())
      .then(data => {
        if (active) {
          setScenario(data.scenario);
          setLoading(false);
          if (data.scenario && !data.scenario.paymentScenarios.find((p: any) => p.id === selectedPlan)) {
            setSelectedPlan(null);
          }
        }
      })
      .catch(err => {
        console.error(err);
        if (active) setLoading(false);
      });
      
    return () => { active = false; };
  }, [selectedProcedure]);

  return (
    <div className="page-container">
      <AnimateIn>
        <PageHeader
          title="Scenario Planner"
          subtitle="Model the financial impact of major medical events"
        />
      </AnimateIn>

      <AnimateIn delay={0.05}>
        <div className="card-base mb-6">
          <label className="text-sm font-medium text-charcoal mb-2 block">Select Procedure</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <select
              value={selectedProcedure}
              onChange={(e) => setSelectedProcedure(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent appearance-none disabled:opacity-50"
            >
              {mockProcedures.map((proc) => (
                <option key={proc} value={proc}>{proc}</option>
              ))}
            </select>
          </div>
        </div>
      </AnimateIn>

      {loading || !scenario ? (
        <div className="space-y-6">
           <Skeleton className="h-32 w-full" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Skeleton className="h-48 w-full" />
             <Skeleton className="h-48 w-full" />
           </div>
           <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          <AnimateIn delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="card-base text-center">
                <p className="text-xs text-neutral-500 mb-1">Total Estimated Cost</p>
                <p className="text-2xl font-semibold">{formatCurrency(scenario.totalEstimatedCost)}</p>
              </div>
              <div className="card-base text-center bg-success-muted border-success/20">
                <p className="text-xs text-success mb-1">Insurance Covers</p>
                <p className="text-2xl font-semibold text-success">{formatCurrency(scenario.insurancePortion)}</p>
              </div>
              <div className="card-base text-center bg-accent-muted border-accent/20">
                <p className="text-xs text-accent mb-1">Your Responsibility</p>
                <p className="text-2xl font-semibold text-accent">{formatCurrency(scenario.userResponsibility)}</p>
              </div>
              <div className="card-base text-center">
                <p className="text-xs text-neutral-500 mb-1">Financial Strain</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${scenario.financialStrainLevel === 'high' ? 'bg-danger-muted text-danger' : scenario.financialStrainLevel === 'moderate' ? 'bg-warning-muted text-warning' : 'bg-success-muted text-success'} text-sm font-medium mt-1`}>
                  <AlertTriangle size={14} />
                  {scenario.financialStrainLevel === 'high' ? 'High Strain' : scenario.financialStrainLevel === 'moderate' ? 'Moderate Strain' : 'Low Strain'}
                </div>
              </div>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet size={16} className="text-neutral-500" />
                  <h3 className="section-title">HSA Strategy</h3>
                </div>
                <div className="flex items-center gap-6">
                  <ProgressRing
                    value={scenario.hsaRecommended}
                    max={scenario.hsaAvailable}
                    size={90}
                    strokeWidth={7}
                  />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm gap-8">
                      <span className="text-neutral-500">HSA Available</span>
                      <span className="font-medium">{formatCurrency(scenario.hsaAvailable)}</span>
                    </div>
                    <div className="flex justify-between text-sm gap-8">
                      <span className="text-neutral-500">Recommended Use</span>
                      <span className="font-medium text-accent">{formatCurrency(scenario.hsaRecommended)}</span>
                    </div>
                    <div className="flex justify-between text-sm gap-8">
                      <span className="text-neutral-500">Remaining After</span>
                      <span className="font-medium">{formatCurrency(scenario.hsaAvailable - scenario.hsaRecommended)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={16} className="text-neutral-500" />
                  <h3 className="section-title">Monthly Impact</h3>
                </div>
                <div className="text-center py-4">
                  <p className="text-4xl font-semibold text-charcoal">{scenario.monthlyImpactPercent}%</p>
                  <p className="text-sm text-neutral-500 mt-1">of monthly income</p>
                  <p className="text-xs text-neutral-400 mt-2">
                    Based on typical payment plan
                  </p>
                </div>
              </div>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <h2 className="section-title mb-4">Payment Scenarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenario.paymentScenarios.map((plan: any, idx: number) => {
                const isSelected = selectedPlan === plan.id;
                const icons = [Wallet, Banknote, Landmark, CreditCard];
                const Icon = icons[idx] || CreditCard;

                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(isSelected ? null : plan.id)}
                    className={`card-base text-left transition-all duration-200 ${
                      isSelected ? "ring-2 ring-charcoal border-charcoal" : "hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-charcoal text-white" : "bg-neutral-50 text-neutral-500"
                      }`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold">{plan.label}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">{plan.duration}</p>
                      </div>
                      {isSelected && <CheckCircle2 size={18} className="text-charcoal" />}
                    </div>

                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-xs text-neutral-500">Monthly</p>
                        <p className="text-xl font-semibold">{formatCurrency(plan.monthlyAmount)}<span className="text-sm font-normal text-neutral-400">/mo</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Total Cost</p>
                        <p className="text-sm font-semibold">{formatCurrency(plan.totalCost)}</p>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-500 pt-3 border-t border-neutral-100">
                      {plan.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </AnimateIn>
        </>
      )}
    </div>
  );
}

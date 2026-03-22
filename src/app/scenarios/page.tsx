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

function fireSelectionBurst() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const colors = ["#3A86FF", "#10B981", "#F8F9FA"];
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.pointerEvents = "none";
  container.style.overflow = "hidden";
  container.style.zIndex = "9999";

  for (let index = 0; index < 28; index += 1) {
    const particle = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 28;
    const distance = 120 + Math.random() * 140;
    const size = 8 + Math.random() * 6;
    const duration = 700 + Math.random() * 300;

    particle.style.position = "absolute";
    particle.style.left = "50%";
    particle.style.top = "60%";
    particle.style.width = `${size}px`;
    particle.style.height = `${size * 0.55}px`;
    particle.style.backgroundColor = colors[index % colors.length];
    particle.style.borderRadius = "999px";
    particle.style.opacity = "0.95";
    particle.style.transform = "translate(-50%, -50%)";

    container.appendChild(particle);

    particle.animate(
      [
        {
          transform: "translate(-50%, -50%) scale(1) rotate(0deg)",
          opacity: 1,
        },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(0.5) rotate(${180 + Math.random() * 180}deg)`,
          opacity: 0,
        },
      ],
      {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
  }

  document.body.appendChild(container);
  window.setTimeout(() => {
    container.remove();
  }, 1200);
}

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

  const handleSelectPlan = (planId: string) => {
    if (selectedPlan !== planId) {
      setSelectedPlan(planId);
      fireSelectionBurst();
    } else {
      setSelectedPlan(null);
    }
  };

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
          <label className="text-base font-bold text-[#111111] mb-2 block">Select Procedure</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <select
              value={selectedProcedure}
              onChange={(e) => setSelectedProcedure(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent appearance-none disabled:opacity-50 mt-1 shadow-sm"
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
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Total Estimated Cost</p>
                <p className="text-2xl font-bold text-charcoal">{formatCurrency(scenario.totalEstimatedCost)}</p>
              </div>
              <div className="card-base text-center bg-success/10 border-success/20">
                <p className="text-xs text-success mb-1">Insurance Covers</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(scenario.insurancePortion)}</p>
              </div>
              <div className="card-base text-center bg-accent/10 border-accent/20 shadow-[0_0_20px_rgba(58,134,255,0.1)]">
                <p className="text-xs text-accent-light mb-1">Your Responsibility</p>
                <p className="text-2xl font-bold text-accent-light">{formatCurrency(scenario.userResponsibility)}</p>
              </div>
              <div className="card-base text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Financial Strain</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${scenario.financialStrainLevel === 'high' ? 'bg-danger/20 text-danger border border-danger/20' : scenario.financialStrainLevel === 'moderate' ? 'bg-warning/20 text-warning border border-warning/20' : 'bg-success/20 text-success border border-success/20'} text-xs font-bold mt-1 shadow-sm`}>
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
                      <span className="font-bold text-[#111111]">{formatCurrency(scenario.hsaAvailable)}</span>
                    </div>
                    <div className="flex justify-between text-sm gap-8">
                      <span className="text-neutral-500">Recommended Use</span>
                      <span className="font-bold text-accent">{formatCurrency(scenario.hsaRecommended)}</span>
                    </div>
                    <div className="flex justify-between text-sm gap-8">
                      <span className="text-neutral-500">Remaining After</span>
                      <span className="font-bold text-[#111111]">{formatCurrency(scenario.hsaAvailable - scenario.hsaRecommended)}</span>
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
                  <p className="text-5xl font-bold text-[#111111] drop-shadow-sm">{scenario.monthlyImpactPercent}%</p>
                  <p className="text-sm text-neutral-500 mt-2">of monthly income</p>
                  <p className="text-xs text-neutral-400 mt-2">
                    Based on a 12-month payment plan at {scenario.financingAPR}% APR
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
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`card-base text-left transition-all duration-300 ${
                      isSelected ? "ring-2 ring-accent border-accent bg-accent/10 shadow-[0_0_30px_rgba(58,134,255,0.2)]" : "hover:border-neutral-200 hover:bg-white/50"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm border ${
                        isSelected ? "bg-accent text-white border-transparent" : "bg-white border-neutral-100 text-neutral-400"
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 mt-1">
                        <h4 className="text-base font-extrabold text-[#111111]">{plan.label}</h4>
                        <p className="text-xs text-accent mt-0.5 font-medium">{plan.duration}</p>
                        {typeof plan.apr === "number" && (
                          <p className="text-xs text-neutral-500 mt-1">{plan.apr}% APR</p>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 size={24} className="text-accent drop-shadow-md" />}
                    </div>

                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-xs text-neutral-500">Monthly</p>
                        <p className="text-2xl font-bold text-[#111111]">{formatCurrency(plan.monthlyAmount)}<span className="text-sm font-bold text-neutral-500 tracking-wide">/mo</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Total Cost</p>
                        <p className="text-base font-extrabold text-[#111111]">{formatCurrency(plan.totalCost)}</p>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-500 pt-3 border-t border-neutral-100 leading-relaxed">
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

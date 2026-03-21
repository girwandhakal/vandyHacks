"use client";

import { AnimateIn } from "@/components/shared/animate-in";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { formatCurrency } from "@/lib/utils";
import { mockInsurancePlan } from "@/lib/mock/insurance";
import {
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Pill,
  Stethoscope,
  Building2,
  Activity,
} from "lucide-react";

export default function InsurancePage() {
  const plan = mockInsurancePlan;
  const deductiblePercent = (plan.deductibleMet.individual / plan.deductible.individual) * 100;
  const oopPercent = (plan.outOfPocketSpent.individual / plan.outOfPocketMax.individual) * 100;
  const planDaysPassed = Math.floor(
    (Date.now() - new Date(plan.planYear.start).getTime()) / (1000 * 60 * 60 * 24)
  );
  const planTotalDays = 365;
  const planYearPercent = Math.round((planDaysPassed / planTotalDays) * 100);

  return (
    <div className="page-container">
      <AnimateIn>
        <PageHeader
          title="Insurance Overview"
          subtitle={`${plan.name} — ${plan.type}`}
          actions={<StatusBadge label="Active" variant="success" />}
        />
      </AnimateIn>

      {/* Plan summary card */}
      <AnimateIn delay={0.05}>
        <div className="card-base mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-muted flex items-center justify-center">
                <Shield size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Provider</p>
                <p className="text-base font-semibold">{plan.provider}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center">
                <Building2 size={20} className="text-neutral-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Plan Type</p>
                <p className="text-base font-semibold">{plan.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center">
                <Calendar size={20} className="text-neutral-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Plan Year</p>
                <p className="text-base font-semibold">
                  {new Date(plan.planYear.start).toLocaleDateString("en-US", { month: "short", year: "numeric" })} –{" "}
                  {new Date(plan.planYear.end).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimateIn>

      {/* Deductible & OOP + Plan Year Progress */}
      <AnimateIn delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card-base flex flex-col items-center py-6">
            <ProgressRing value={plan.deductibleMet.individual} max={plan.deductible.individual} size={110} />
            <p className="text-sm font-medium mt-3">Individual Deductible</p>
            <p className="text-lg font-semibold">
              {formatCurrency(plan.deductibleMet.individual)} / {formatCurrency(plan.deductible.individual)}
            </p>
            <StatusBadge label={`${Math.round(deductiblePercent)}% met`} variant="accent" className="mt-2" />
          </div>
          <div className="card-base flex flex-col items-center py-6">
            <ProgressRing value={plan.outOfPocketSpent.individual} max={plan.outOfPocketMax.individual} size={110} />
            <p className="text-sm font-medium mt-3">Out-of-Pocket Max</p>
            <p className="text-lg font-semibold">
              {formatCurrency(plan.outOfPocketSpent.individual)} / {formatCurrency(plan.outOfPocketMax.individual)}
            </p>
            <StatusBadge label={`${Math.round(oopPercent)}% used`} variant="accent" className="mt-2" />
          </div>
          <div className="card-base flex flex-col items-center py-6">
            <ProgressRing value={planDaysPassed} max={planTotalDays} size={110} />
            <p className="text-sm font-medium mt-3">Plan Year Progress</p>
            <p className="text-lg font-semibold">{planYearPercent}%</p>
            <StatusBadge label={`Day ${planDaysPassed} of ${planTotalDays}`} variant="neutral" className="mt-2" />
          </div>
        </div>
      </AnimateIn>

      {/* Copays & Coinsurance Grid */}
      <AnimateIn delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card-base">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope size={16} className="text-neutral-500" />
              <h3 className="section-title">Copays</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(plan.copays).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-1.5 border-b border-neutral-50 last:border-0">
                  <span className="text-sm text-neutral-600 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="text-sm font-semibold">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-base">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-neutral-500" />
              <h3 className="section-title">Coinsurance</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-50">
                <span className="text-sm text-neutral-600">In-Network</span>
                <span className="text-sm font-semibold">{plan.coinsurance.inNetwork}% / {100 - plan.coinsurance.inNetwork}%</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-neutral-600">Out-of-Network</span>
                <span className="text-sm font-semibold">{plan.coinsurance.outOfNetwork}% / {100 - plan.coinsurance.outOfNetwork}%</span>
              </div>
              <p className="text-xs text-neutral-400 mt-2">Insurance pays / You pay (after deductible)</p>
            </div>
          </div>
        </div>
      </AnimateIn>

      {/* Pharmacy Benefits */}
      <AnimateIn delay={0.2}>
        <div className="card-base mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Pill size={16} className="text-neutral-500" />
            <h3 className="section-title">Pharmacy Benefits</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-neutral-500">Generic</p>
              <p className="text-lg font-semibold">{formatCurrency(plan.pharmacyBenefits.generic)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Preferred Brand</p>
              <p className="text-lg font-semibold">{formatCurrency(plan.pharmacyBenefits.preferred)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Non-Preferred</p>
              <p className="text-lg font-semibold">{formatCurrency(plan.pharmacyBenefits.nonPreferred)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Specialty</p>
              <p className="text-sm font-medium mt-0.5">{plan.pharmacyBenefits.specialty}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Mail Order</p>
              <p className="text-sm font-medium mt-0.5">{plan.pharmacyBenefits.mailOrder}</p>
            </div>
          </div>
        </div>
      </AnimateIn>

      {/* Coverage Rules, Exclusions, Prior Auth */}
      <AnimateIn delay={0.25}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card-base">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-success" />
              <h3 className="text-sm font-semibold">Coverage Rules</h3>
            </div>
            <ul className="space-y-2">
              {plan.coverageRules.map((rule, i) => (
                <li key={i} className="text-xs text-neutral-600 flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span> {rule}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-base">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-warning" />
              <h3 className="text-sm font-semibold">Exclusions</h3>
            </div>
            <ul className="space-y-2">
              {plan.exclusions.map((exc, i) => (
                <li key={i} className="text-xs text-neutral-600 flex items-start gap-2">
                  <span className="text-warning mt-0.5">✕</span> {exc}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-base">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-accent" />
              <h3 className="text-sm font-semibold">Prior Auth Required</h3>
            </div>
            <ul className="space-y-2">
              {plan.priorAuthRequired.map((item, i) => (
                <li key={i} className="text-xs text-neutral-600 flex items-start gap-2">
                  <span className="text-accent mt-0.5">●</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </AnimateIn>
    </div>
  );
}

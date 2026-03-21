"use client";

import { useState } from "react";
import { AnimateIn } from "@/components/shared/animate-in";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils";
import { mockCareOptions, mockVisitTypes } from "@/lib/mock/cost-estimator";
import {
  Search,
  Monitor,
  Stethoscope,
  Clock,
  Siren,
  CheckCircle2,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { CareSetting } from "@/types";

const settingIcons: Record<CareSetting, React.ElementType> = {
  telehealth: Monitor,
  primary_care: Stethoscope,
  urgent_care: Clock,
  emergency_room: Siren,
  specialist: Stethoscope,
  hospital: Siren,
};

export default function CostEstimatorPage() {
  const [selectedVisit, setSelectedVisit] = useState("Joint / muscle pain");
  const [inNetwork, setInNetwork] = useState(true);
  const [selectedSetting, setSelectedSetting] = useState<CareSetting | null>(null);

  const selectedOption = selectedSetting
    ? mockCareOptions.find((o) => o.setting === selectedSetting)
    : null;

  return (
    <div className="page-container">
      <AnimateIn>
        <PageHeader
          title="Cost Estimator"
          subtitle="Estimate costs for medical visits and compare care options"
        />
      </AnimateIn>

      {/* Input Section */}
      <AnimateIn delay={0.05}>
        <div className="card-base mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visit type selector */}
            <div>
              <label className="text-sm font-medium text-charcoal mb-2 block">
                What do you need care for?
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <select
                  value={selectedVisit}
                  onChange={(e) => setSelectedVisit(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent appearance-none"
                >
                  {mockVisitTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Network toggle */}
            <div>
              <label className="text-sm font-medium text-charcoal mb-2 block">
                Provider Network
              </label>
              <button
                onClick={() => setInNetwork(!inNetwork)}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm"
              >
                {inNetwork ? (
                  <ToggleRight size={20} className="text-accent" />
                ) : (
                  <ToggleLeft size={20} className="text-neutral-400" />
                )}
                <span className={inNetwork ? "text-charcoal font-medium" : "text-neutral-500"}>
                  {inNetwork ? "In-Network" : "Out-of-Network"}
                </span>
                {inNetwork && <StatusBadge label="Recommended" variant="success" className="ml-auto" />}
              </button>
            </div>
          </div>
        </div>
      </AnimateIn>

      {/* Compare cards */}
      <AnimateIn delay={0.1}>
        <h2 className="section-title mb-4">Compare Care Options</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mockCareOptions.map((option, idx) => {
            const Icon = settingIcons[option.setting] || Stethoscope;
            const isSelected = selectedSetting === option.setting;

            return (
              <AnimateIn key={option.setting} delay={0.1 + idx * 0.03}>
                <button
                  onClick={() => setSelectedSetting(isSelected ? null : option.setting)}
                  className={`card-base w-full text-left transition-all duration-200 ${
                    isSelected
                      ? "ring-2 ring-charcoal border-charcoal"
                      : "hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-charcoal text-white" : "bg-neutral-50 text-neutral-500"
                    }`}>
                      <Icon size={18} />
                    </div>
                    <h3 className="text-sm font-semibold">{option.label}</h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Est. total</span>
                      <span className="font-medium">{formatCurrency(option.estimatedCost)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Insurance pays</span>
                      <span className="font-medium text-success">{formatCurrency(option.insuranceCoverage)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">You pay</span>
                      <span className="font-semibold text-charcoal">{formatCurrency(option.outOfPocket)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
                      <Clock size={12} />
                      <span>Wait: {option.waitTime}</span>
                    </div>
                    <p className="text-xs text-neutral-500">{option.bestFor}</p>
                  </div>
                </button>
              </AnimateIn>
            );
          })}
        </div>
      </AnimateIn>

      {/* Selected detail panel */}
      {selectedOption && (
        <AnimateIn delay={0.05}>
          <div className="card-base">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 size={18} className="text-accent" />
              <h3 className="section-title">Cost Breakdown — {selectedOption.label}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 rounded-lg bg-neutral-50 text-center">
                <p className="text-xs text-neutral-500 mb-1">Estimated Total</p>
                <p className="text-2xl font-semibold">{formatCurrency(selectedOption.estimatedCost)}</p>
              </div>
              <div className="p-4 rounded-lg bg-success-muted text-center">
                <p className="text-xs text-success mb-1">Insurance Covers</p>
                <p className="text-2xl font-semibold text-success">{formatCurrency(selectedOption.insuranceCoverage)}</p>
              </div>
              <div className="p-4 rounded-lg bg-accent-muted text-center">
                <p className="text-xs text-accent mb-1">Your Responsibility</p>
                <p className="text-2xl font-semibold text-accent">{formatCurrency(selectedOption.outOfPocket)}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Assumptions</p>
              <ul className="space-y-1 text-xs text-neutral-600">
                <li className="flex items-start gap-1.5"><span className="text-neutral-300 mt-0.5">•</span> Using in-network provider</li>
                <li className="flex items-start gap-1.5"><span className="text-neutral-300 mt-0.5">•</span> Based on current deductible progress (67% met)</li>
                <li className="flex items-start gap-1.5"><span className="text-neutral-300 mt-0.5">•</span> Standard visit without additional procedures</li>
                <li className="flex items-start gap-1.5"><span className="text-neutral-300 mt-0.5">•</span> Regional average pricing for {selectedVisit.toLowerCase()}</li>
              </ul>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <StatusBadge label="Medium confidence" variant="warning" />
              <span className="text-xs text-neutral-400">Actual costs may vary by provider and services rendered</span>
            </div>
          </div>
        </AnimateIn>
      )}
    </div>
  );
}

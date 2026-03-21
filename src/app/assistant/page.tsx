"use client";

import { useState } from "react";
import { AnimateIn } from "@/components/shared/animate-in";
import { StatusBadge } from "@/components/shared/status-badge";
import { mockConversation, mockSuggestedQuestions } from "@/lib/mock/assistant";
import { formatCurrency } from "@/lib/utils";
import {
  Send,
  Sparkles,
  User,
  ShieldCheck,
  DollarSign,
  TrendingDown,
  ListChecks,
  Gauge,
  Paperclip,
} from "lucide-react";
import type { StructuredResponse } from "@/types";

function ConfidenceBadge({ level }: { level: string }) {
  const variant = level === "high" ? "success" : level === "medium" ? "warning" : "danger";
  return <StatusBadge label={`${level} confidence`} variant={variant} />;
}

function StructuredResponseCard({ data }: { data: StructuredResponse }) {
  return (
    <div className="space-y-4 mt-3">
      {/* Recommendation */}
      <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={14} className="text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recommendation</span>
        </div>
        <p className="text-sm text-charcoal leading-relaxed">{data.recommendation}</p>
      </div>

      {/* Cost & Coverage Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-success" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Expected Cost</span>
          </div>
          <p className="text-lg font-semibold">
            {formatCurrency(data.expectedCost.low)} – {formatCurrency(data.expectedCost.high)}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Coverage</span>
          </div>
          <p className="text-sm text-charcoal leading-relaxed">{data.coverageEstimate}</p>
        </div>
      </div>

      {/* Financial Impact */}
      <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown size={14} className="text-success" />
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Financial Impact</span>
        </div>
        <p className="text-sm text-charcoal leading-relaxed">{data.financialImpact}</p>
      </div>

      {/* Assumptions */}
      <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks size={14} className="text-neutral-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Assumptions</span>
        </div>
        <ul className="space-y-1">
          {data.assumptions.map((a, i) => (
            <li key={i} className="text-xs text-neutral-500 flex items-start gap-1.5">
              <span className="text-neutral-300 mt-0.5">•</span> {a}
            </li>
          ))}
        </ul>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2">
        <Gauge size={14} className="text-neutral-400" />
        <ConfidenceBadge level={data.confidenceLevel} />
      </div>

      {/* Follow-up chips */}
      {data.followUpQuestions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {data.followUpQuestions.map((q, i) => (
            <button
              key={i}
              className="px-3 py-1.5 rounded-full border border-neutral-200 text-xs text-neutral-600 hover:bg-charcoal hover:text-white hover:border-charcoal transition-colors duration-150"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const conversation = mockConversation;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
            <Sparkles size={16} className="text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">AI Assistant</h1>
            <p className="text-xs text-neutral-400">Ask about costs, coverage, symptoms, or care options</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Suggested questions (shown at top) */}
        <AnimateIn>
          <div className="mb-6">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Suggested Questions</p>
            <div className="flex flex-wrap gap-2">
              {mockSuggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 rounded-full border border-neutral-200 text-xs text-neutral-600 hover:bg-charcoal hover:text-white hover:border-charcoal transition-colors duration-150"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </AnimateIn>

        {/* Conversation messages */}
        {conversation.messages.map((msg, idx) => (
          <AnimateIn key={msg.id} delay={idx * 0.05}>
            <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles size={14} className="text-accent" />
                </div>
              )}
              <div className={`max-w-2xl ${msg.role === "user" ? "order-first" : ""}`}>
                <div
                  className={`rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-charcoal text-white"
                      : "bg-white border border-neutral-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                {msg.structuredResponse && (
                  <StructuredResponseCard data={msg.structuredResponse} />
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={14} className="text-neutral-500" />
                </div>
              )}
            </div>
          </AnimateIn>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-neutral-200 bg-white">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button className="p-2 rounded-lg text-neutral-400 hover:text-charcoal hover:bg-neutral-50 transition-colors">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about costs, coverage, symptoms..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-neutral-50 placeholder:text-neutral-400"
          />
          <button className="p-2.5 rounded-xl bg-charcoal text-white hover:bg-charcoal-light transition-colors">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

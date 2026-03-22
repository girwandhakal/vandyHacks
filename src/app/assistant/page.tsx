"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimateIn } from "@/components/shared/animate-in";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils";
import type { StructuredResponse, StrategyOption } from "@/types";
import {
  BadgeDollarSign,
  FileStack,
  Gauge,
  ListChecks,
  NotebookPen,
  Paperclip,
  PiggyBank,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  User,
} from "lucide-react";

function ConfidenceBadge({ level }: { level: string }) {
  const variant = level === "high" ? "success" : level === "medium" ? "warning" : "danger";
  return <StatusBadge label={`${level} confidence`} variant={variant} />;
}

function StrategyCard({ option }: { option: StrategyOption }) {
  return (
    <div className={`rounded-xl border p-4 ${option.recommended ? "border-accent/30 bg-accent/5" : "border-neutral-200 bg-neutral-50/70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-charcoal">{option.label}</p>
          <p className="text-xs text-neutral-500 mt-1">{option.whyItFitsUser}</p>
        </div>
        {option.recommended ? <StatusBadge label="Recommended" variant="accent" /> : <StatusBadge label={option.feasibility} variant={option.feasibility === "high" ? "success" : option.feasibility === "medium" ? "warning" : "danger"} />}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-lg bg-white border border-neutral-200 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Monthly</p>
          <p className="text-sm font-semibold text-charcoal">{formatCurrency(option.monthlyCost)}</p>
        </div>
        <div className="rounded-lg bg-white border border-neutral-200 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Total</p>
          <p className="text-sm font-semibold text-charcoal">{formatCurrency(option.totalCost)}</p>
        </div>
      </div>

      {option.requiredActions.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">Required actions</p>
          <ul className="space-y-1">
            {option.requiredActions.map((action, index) => (
              <li key={index} className="text-xs text-neutral-600">
                - {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StructuredResponseCard({ data, onFollowUp }: { data: StructuredResponse; onFollowUp: (q: string) => void }) {
  return (
    <div className="space-y-4 mt-3">
      <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
        <div className="flex items-center gap-2 mb-2">
          <BadgeDollarSign size={15} className="text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recommended Strategy</span>
        </div>
        <p className="text-sm font-medium text-charcoal">{data.recommendedStrategy}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <NotebookPen size={14} className="text-neutral-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Situation</span>
          </div>
          <p className="text-sm text-charcoal leading-relaxed">{data.situationSummary}</p>
        </div>
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <TriangleAlert size={14} className="text-warning" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Bill Assessment</span>
          </div>
          <p className="text-sm text-charcoal leading-relaxed">{data.billAssessment}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Insurance</span>
          </div>
          <p className="text-sm text-charcoal leading-relaxed">{data.insuranceAssessment}</p>
        </div>
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank size={14} className="text-success" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Financial Fit</span>
          </div>
          <p className="text-sm text-charcoal leading-relaxed">{data.financialAssessment}</p>
        </div>
      </div>

      {data.strategyOptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ListChecks size={14} className="text-neutral-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Strategy Options</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {data.strategyOptions.map((option) => (
              <StrategyCard key={`${option.label}-${option.monthlyCost}`} option={option} />
            ))}
          </div>
        </div>
      )}

      {data.immediateNextSteps.length > 0 && (
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks size={14} className="text-neutral-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Immediate Next Steps</span>
          </div>
          <ul className="space-y-1.5">
            {data.immediateNextSteps.map((step, index) => (
              <li key={index} className="text-sm text-charcoal">
                {index + 1}. {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks size={14} className="text-neutral-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Assumptions</span>
          </div>
          {data.assumptions.length > 0 ? (
            <ul className="space-y-1">
              {data.assumptions.map((assumption, index) => (
                <li key={index} className="text-xs text-neutral-500">
                  - {assumption}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-400">No major assumptions noted.</p>
          )}
        </div>
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <TriangleAlert size={14} className="text-warning" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Missing Information</span>
          </div>
          {data.missingInformation.length > 0 ? (
            <ul className="space-y-1">
              {data.missingInformation.map((item, index) => (
                <li key={index} className="text-xs text-neutral-500">
                  - {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-400">No critical gaps identified.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-neutral-400" />
          <ConfidenceBadge level={data.confidenceLevel} />
        </div>
        {data.documentsReferenced.map((document) => (
          <span key={`${document.type}-${document.id}`} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-500">
            <FileStack size={12} />
            {document.label}
          </span>
        ))}
      </div>

      {data.followUpQuestions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {data.followUpQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onFollowUp(q)}
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

const mockSuggestedQuestions = [
  "How should I handle this medical bill?",
  "Does this bill match my EOB?",
  "Should I negotiate or ask for a payment plan?",
];

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeBillId = searchParams.get("billId");
  const activeBillLabel = searchParams.get("label") || "Selected medical bill";

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setInput("");
    const userMsg = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId, billId: activeBillId }),
      });

      if (!res.ok) throw new Error("API failed");

      const json = await res.json();
      if (!conversationId && json.conversationId) setConversationId(json.conversationId);
      setMessages((prev) => [...prev, json.message]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Sorry, I encountered an error. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-4 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
            <Sparkles size={16} className="text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">AI Assistant</h1>
            <p className="text-xs text-neutral-400">Financially aware medical-bill guidance using your plan, bills, EOBs, and cash-flow context</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {activeBillId && (
          <AnimateIn>
            <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">Bill context active</p>
              <p className="text-sm text-charcoal">{activeBillLabel}</p>
            </div>
          </AnimateIn>
        )}

        <AnimateIn>
          <div className="mb-6">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Suggested Questions</p>
            <div className="flex flex-wrap gap-2">
              {mockSuggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 rounded-full border border-neutral-200 text-xs text-neutral-600 hover:bg-charcoal hover:text-white hover:border-charcoal transition-colors duration-150"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </AnimateIn>

        {messages.map((msg, idx) => (
          <AnimateIn key={msg.id} delay={idx * 0.05}>
            <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles size={14} className="text-accent" />
                </div>
              )}
              <div className={`max-w-3xl ${msg.role === "user" ? "order-first" : ""}`}>
                <div
                  className={`rounded-xl px-4 py-3 ${
                    msg.role === "user" ? "bg-charcoal text-white" : "bg-white border border-neutral-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.structuredResponse && <StructuredResponseCard data={msg.structuredResponse} onFollowUp={sendMessage} />}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={14} className="text-neutral-500" />
                </div>
              )}
            </div>
          </AnimateIn>
        ))}

        {loading && (
          <AnimateIn>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles size={14} className="text-accent" />
              </div>
              <div className="max-w-2xl">
                <div className="rounded-xl px-4 py-3 bg-white border border-neutral-200 flex items-center gap-1 h-[46px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </AnimateIn>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-4 border-t border-neutral-200 bg-white">
        <form
          className="flex items-center gap-3 max-w-4xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <button type="button" className="p-2 rounded-lg text-neutral-400 hover:text-charcoal hover:bg-neutral-50 transition-colors">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={activeBillId ? "Ask how to handle this bill, compare it to the EOB, or evaluate payment options..." : "Ask about costs, coverage, bills, or payment strategies..."}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-neutral-50 placeholder:text-neutral-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-charcoal text-white hover:bg-charcoal-light transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

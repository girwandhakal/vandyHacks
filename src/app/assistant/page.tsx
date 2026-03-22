"use client";

import { useState, useEffect, useRef } from "react";
import { AnimateIn } from "@/components/shared/animate-in";
import { StatusBadge } from "@/components/shared/status-badge";
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

function StructuredResponseCard({ data, onFollowUp }: { data: StructuredResponse, onFollowUp: (q: string) => void }) {
  return (
    <div className="space-y-4 mt-3">
      <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={14} className="text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recommendation</span>
        </div>
        <p className="text-sm text-charcoal leading-relaxed">{data.recommendation}</p>
      </div>

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

      <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown size={14} className="text-success" />
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Financial Impact</span>
        </div>
        <p className="text-sm text-charcoal leading-relaxed">{data.financialImpact}</p>
      </div>

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

      <div className="flex items-center gap-2">
        <Gauge size={14} className="text-neutral-400" />
        <ConfidenceBadge level={data.confidenceLevel} />
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
  "How much does an MRI cost?",
  "Am I covered for a dermatologist visit?",
  "Explain my deductible progress",
];

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
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
        body: JSON.stringify({ message: text, conversationId }),
      });
      
      if (!res.ok) throw new Error("API failed");
      
      const json = await res.json();
      if (!conversationId && json.conversationId) setConversationId(json.conversationId);
      setMessages((prev) => [...prev, json.message]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Sorry, I encountered an error. Please try again later." }
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
            <p className="text-xs text-neutral-400">Ask about costs, coverage, symptoms, or care options</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
              <div className={`max-w-2xl ${msg.role === "user" ? "order-first" : ""}`}>
                <div
                  className={`rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-charcoal text-white"
                      : "bg-white border border-neutral-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.structuredResponse && (
                  <StructuredResponseCard data={msg.structuredResponse} onFollowUp={sendMessage} />
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
          className="flex items-center gap-3 max-w-3xl mx-auto"
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        >
          <button type="button" className="p-2 rounded-lg text-neutral-400 hover:text-charcoal hover:bg-neutral-50 transition-colors">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask about costs, coverage, symptoms..."
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

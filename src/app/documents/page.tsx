"use client";

import { AnimateIn } from "@/components/shared/animate-in";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { mockDocuments } from "@/lib/mock/documents";
import { formatCurrency } from "@/lib/utils";
import {
  Upload,
  FileText,
  Shield,
  Receipt,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CloudUpload,
} from "lucide-react";
import type { DocumentType, DocumentStatus } from "@/types";

const typeLabels: Record<DocumentType, string> = {
  insurance_plan: "Insurance Plan",
  eob: "Explanation of Benefits",
  medical_bill: "Medical Bill",
  estimate: "Cost Estimate",
};

const typeIcons: Record<DocumentType, React.ElementType> = {
  insurance_plan: Shield,
  eob: Receipt,
  medical_bill: FileText,
  estimate: Calculator,
};

const statusConfig: Record<DocumentStatus, { label: string; variant: "success" | "warning" | "danger" | "accent"; icon: React.ElementType }> = {
  ready: { label: "Ready", variant: "success", icon: CheckCircle2 },
  analyzing: { label: "Analyzing", variant: "warning", icon: Loader2 },
  error: { label: "Error", variant: "danger", icon: AlertCircle },
  uploading: { label: "Uploading", variant: "accent", icon: CloudUpload },
};

export default function DocumentsPage() {
  return (
    <div className="page-container">
      <AnimateIn>
        <PageHeader
          title="Documents"
          subtitle="Upload and manage your insurance documents, EOBs, and medical bills"
        />
      </AnimateIn>

      {/* Upload zone */}
      <AnimateIn delay={0.05}>
        <div className="card-base mb-8 border-2 border-dashed border-neutral-200 hover:border-accent/40 transition-colors duration-200 cursor-pointer">
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-neutral-50 flex items-center justify-center mb-4">
              <Upload size={24} className="text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-charcoal mb-1">Drop files here or click to upload</p>
            <p className="text-xs text-neutral-400 mb-4">
              Supports insurance plans, EOBs, medical bills, cost estimates
            </p>
            <div className="flex gap-2">
              <span className="badge bg-neutral-100 text-neutral-500">PDF</span>
              <span className="badge bg-neutral-100 text-neutral-500">PNG</span>
              <span className="badge bg-neutral-100 text-neutral-500">JPG</span>
              <span className="badge bg-neutral-100 text-neutral-500">HEIC</span>
            </div>
          </div>
        </div>
      </AnimateIn>

      {/* Document list */}
      <AnimateIn delay={0.1}>
        <h2 className="section-title mb-4">Uploaded Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockDocuments.map((doc, idx) => {
            const TypeIcon = typeIcons[doc.type];
            const status = statusConfig[doc.status];
            const StatusIcon = status.icon;

            return (
              <AnimateIn key={doc.id} delay={0.1 + idx * 0.03}>
                <div className="card-base group cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center flex-shrink-0">
                      <TypeIcon size={18} className="text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate group-hover:text-accent transition-colors">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-neutral-400">{typeLabels[doc.type]}</span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-xs text-neutral-400">{doc.fileSize}</span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-xs text-neutral-400">
                          {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <StatusIcon
                          size={12}
                          className={`text-${status.variant} ${doc.status === "analyzing" ? "animate-spin" : ""}`}
                        />
                        <StatusBadge label={status.label} variant={status.variant} />
                      </div>
                    </div>
                  </div>

                  {/* Extracted data card */}
                  {doc.extractedData && (
                    <div className="mt-4 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Extracted Summary</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-neutral-400">Plan</span>
                          <p className="font-medium text-charcoal">{doc.extractedData.planName}</p>
                        </div>
                        <div>
                          <span className="text-neutral-400">Coverage</span>
                          <p className="font-medium text-charcoal">{doc.extractedData.coverage}</p>
                        </div>
                        <div>
                          <span className="text-neutral-400">Deductible</span>
                          <p className="font-medium text-charcoal">{formatCurrency(doc.extractedData.deductible)}</p>
                        </div>
                        <div>
                          <span className="text-neutral-400">OOP Max</span>
                          <p className="font-medium text-charcoal">{formatCurrency(doc.extractedData.outOfPocketMax)}</p>
                        </div>
                      </div>
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

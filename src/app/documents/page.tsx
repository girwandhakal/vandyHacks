"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimateIn } from "@/components/shared/animate-in";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/shared/skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  Shield,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CloudUpload,
  Link as LinkIcon,
  Unlink,
  ArchiveRestore,
  Archive,
  Trash2,
  MessageSquareText
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "accent"; icon: React.ElementType }> = {
  ready: { label: "Ready", variant: "success", icon: CheckCircle2 },
  analyzing: { label: "Analyzing...", variant: "warning", icon: Loader2 },
  error: { label: "Rejected", variant: "danger", icon: AlertCircle },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingGlobal, setUploadingGlobal] = useState(false);
  const [linking, setLinking] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(() => {
      setDocuments(prev => {
        if (prev.some(d => d.status === "analyzing")) fetchDocs();
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchDocs]);

  const handleGlobalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingGlobal(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (res.ok) fetchDocs();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploadingGlobal(false);
      e.target.value = "";
    }
  };

  const handleLink = async (billId: string, eobId: string) => {
    if (!billId || !eobId) return;
    setLinking(true);
    try {
      const res = await fetch("/api/documents/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, eobId }),
      });
      if (res.ok) await fetchDocs();
    } catch (e) {
      console.error(e);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (eobId: string) => {
    if (!eobId) return;
    setLinking(true); // Reuse linking state for loaders
    try {
      const res = await fetch("/api/documents/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eobId }),
      });
      if (res.ok) await fetchDocs();
    } catch (e) {
      console.error(e);
    } finally {
      setLinking(false);
    }
  };

  const handleSettle = async (billId: string) => {
    if (!billId) return;
    setLinking(true);
    try {
      const res = await fetch("/api/documents/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId }),
      });
      if (res.ok) await fetchDocs();
    } catch (e) {
      console.error("Failed to settle claim.", e);
    } finally {
      setLinking(false);
    }
  };

  const handleDelete = async (documentId: string, docName: string) => {
    if (!documentId) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${docName}"? This action cannot be undone.`)) return;
    
    setLinking(true);
    try {
      const res = await fetch("/api/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (res.ok) await fetchDocs();
    } catch (e) {
      console.error("Failed to delete document.", e);
    } finally {
      setLinking(false);
    }
  };

  const handleUnsettle = async (billId: string) => {
    if (!billId) return;
    setLinking(true);
    try {
      const res = await fetch("/api/documents/unsettle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId }),
      });
      if (res.ok) await fetchDocs();
    } catch (e) {
      console.error("Failed to unsettle claim.", e);
    } finally {
      setLinking(false);
    }
  };

  const renderExtractedData = (doc: any, extractedData: any) => {
    if (!extractedData || Object.keys(extractedData).length === 0) return null;

    if (doc.status === "error" && extractedData.rejectionReason) {
      return (
        <div className="mt-4 p-3 rounded-lg bg-danger-muted border border-danger/20">
          <div className="flex items-start gap-2 text-danger">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium leading-relaxed">{extractedData.rejectionReason}</p>
          </div>
        </div>
      );
    }

    if (doc.status === "ready") {
      return (
        <div className="mt-4 pt-4 border-t border-neutral-100/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {extractedData.network && (
              <div>
                <span className="text-xs text-neutral-500 block mb-0.5">Network</span>
                <p className="font-medium text-[#111111]">{extractedData.network}</p>
              </div>
            )}
            {extractedData.providerName && (
              <div>
                <span className="text-xs text-neutral-500 block mb-0.5">Provider</span>
                <p className="font-medium text-[#111111]">{extractedData.providerName}</p>
              </div>
            )}
            {extractedData.dateOfService && (
              <div>
                <span className="text-xs text-neutral-500 block mb-0.5">Date of Service</span>
                <p className="font-medium text-[#111111]">{extractedData.dateOfService}</p>
              </div>
            )}
            {extractedData.totalAmount !== undefined && (
              <div>
                <span className="text-xs text-neutral-500 block mb-0.5">Total Charged</span>
                <p className="font-medium text-[#111111]">{formatCurrency(extractedData.totalAmount)}</p>
              </div>
            )}
            {extractedData.currentBalance !== undefined && (
              <div>
                <span className="text-xs text-neutral-400 block mb-0.5">Current Balance</span>
                <p className="font-medium text-charcoal">{formatCurrency(extractedData.currentBalance)}</p>
              </div>
            )}
            {extractedData.patientResponsibility !== undefined && (
              <div>
                <span className="text-xs text-neutral-500 block mb-0.5">Your Responsibility</span>
                <p className="font-medium text-accent">{formatCurrency(extractedData.patientResponsibility)}</p>
              </div>
            )}
            {extractedData.dueDate && (
              <div>
                <span className="text-xs text-neutral-400 block mb-0.5">Due Date</span>
                <p className="font-medium text-charcoal">{extractedData.dueDate}</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const isGlobalAnalyzingContext = documents.some(d => d.type === "unknown" && d.status === "analyzing");
  const isGlobalLoading = uploadingGlobal || isGlobalAnalyzingContext;

  const insurancePlan = documents.find(d => d.type === "insurance_plan");
  
  const bills = documents.filter((d) => d.type === "medical_bill");
  const eobs = documents.filter((d) => d.type === "eob");
  
  const allClaims = bills.map((bill) => {
    const matchingEob = eobs.find((e) => e.linkedBillId === bill.id);
    return { bill, eob: matchingEob };
  });

  const activeClaims = allClaims.filter(c => !c.bill.isSettled);
  const settledClaims = allClaims.filter(c => c.bill.isSettled);

  // Unlinked EOBs shouldn't be settled yet realistically, but safe to filter active only
  const unlinkedEobs = eobs.filter((e) => !e.linkedBillId && !e.isSettled);
  const unlinkedBills = activeClaims.filter((c) => !c.eob).map(c => c.bill);

  return (
    <div className="page-container pb-20">
      <AnimateIn>
        <PageHeader
          title="Documents"
          subtitle="Upload any healthcare files here. Our AI autonomously classifies it, extracts the costs, and matches EOBs directly to their resulting bills."
        />
      </AnimateIn>

      {/* Global Universal Upload Dropzone */}
      <AnimateIn delay={0.05}>
        <div className={`card-base mb-8 relative overflow-hidden group border-2 transition-all duration-500 py-12 ${
          isGlobalLoading ? "border-accent shadow-[0_0_40px_rgba(58,134,255,0.2)] bg-accent/5 backdrop-blur-2xl" : "border-dashed border-neutral-200 hover:border-accent hover:bg-white/50"
        }`}>
          {!isGlobalLoading && (
            <input 
              type="file" 
              accept=".pdf,.csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={handleGlobalUpload}
            />
          )}

          {isGlobalLoading ? (
            <div className="flex flex-col items-center justify-center w-full relative">
              <div className="relative w-28 h-36 bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
                 <FileText size={48} className="text-neutral-300" />
                 
                 {/* Glowing Laser Scan Line */}
                 <motion.div 
                   className="absolute left-0 right-0 h-1 bg-accent shadow-[0_0_20px_4px_rgba(58,134,255,0.8)] z-20"
                   animate={{ top: ["0%", "100%", "0%"] }}
                   transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                 />
                 
                 {/* Laser Scan Body Gradient */}
                 <motion.div 
                   className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent z-10"
                   animate={{ top: ["-100%", "100%", "-100%"] }}
                   transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                 />
              </div>
              <motion.h3 
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                className="text-lg font-bold text-charcoal mt-8 tracking-wide drop-shadow-sm"
              >
                Autonomous AI Analyzing...
              </motion.h3>
              <p className="text-xs text-accent mt-2 animate-pulse">Extracting financial data & verifying policies</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-5 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300 shadow-[0_0_30px_rgba(58,134,255,0.15)]">
                <CloudUpload size={40} />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-2 drop-shadow-sm">Upload Medical Document</h3>
              <p className="text-sm text-neutral-400 max-w-sm mx-auto">
                Drop an insurance plan, medical bill, or EOB here. Our AI will automatically classify and route it.
              </p>
            </div>
          )}
        </div>
      </AnimateIn>

      {/* Core Policy Document (Singleton) */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-4 flex items-center gap-2">
          <Shield className="text-accent" size={20} /> Active Insurance Policy
        </h2>
        
        {loading && !insurancePlan ? (
          <Skeleton className="h-32 w-full" />
        ) : insurancePlan ? (
          <AnimateIn>
            <div className="card-base">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#111111] text-lg">{insurancePlan.name}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">{insurancePlan.fileSize} • Uploaded {new Date(insurancePlan.uploadedAt).toLocaleDateString()}</p>
                    </div>
                 </div>
                 {(() => {
                    const statusObj = statusConfig[insurancePlan.status] || statusConfig.ready;
                    const StatusIcon = statusObj.icon;
                    return (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <StatusIcon size={14} className={`text-${statusObj.variant} ${insurancePlan.status === "analyzing" ? "animate-spin" : ""}`} />
                        <StatusBadge label={statusObj.label} variant={statusObj.variant} />
                        <button 
                          onClick={() => handleDelete(insurancePlan.id, insurancePlan.name)}
                          disabled={linking}
                          className="ml-2 w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:bg-danger/10 hover:text-danger transition-colors"
                          title="Delete Policy"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })()}
              </div>
              {renderExtractedData(insurancePlan, insurancePlan.extractedData ? JSON.parse(insurancePlan.extractedData) : null)}
            </div>
          </AnimateIn>
        ) : (
          <div className="py-8 px-6 border-2 border-dashed border-neutral-200 rounded-2xl bg-white/50 flex flex-col items-center">
             <Shield size={32} className="text-neutral-300 mb-3" />
             <p className="text-sm font-bold text-neutral-600 tracking-wide">No Active Policy Uploaded</p>
          </div>
        )}
      </div>

      {/* ACTIVE Relational Claims Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-4 flex items-center gap-2">
          <FileText className="text-neutral-600" size={20} /> Active Medical Claims
        </h2>

        {loading && activeClaims.length === 0 && unlinkedEobs.length === 0 ? (
           <Skeleton className="h-64 w-full" />
        ) : activeClaims.length === 0 && unlinkedEobs.length === 0 ? (
           <div className="py-12 border-2 border-dashed border-neutral-200 rounded-2xl bg-white/50 flex flex-col items-center text-center">
             <Receipt size={40} className="text-neutral-300 mb-4" />
             <p className="text-base font-bold text-neutral-400">No Active Claims</p>
             <p className="text-sm text-neutral-500 mt-2 max-w-xs leading-relaxed">Upload medical bills and Explanation of Benefits statements above. AI will automatch them.</p>
           </div>
        ) : (
          <div className="space-y-6">
            
            {/* Display Claims (Bills + Linked EOBs) */}
            {activeClaims.map((claim, idx) => (
               <AnimateIn key={claim.bill.id} delay={0.1 + idx * 0.05}>
                  <div className="card-base p-0 overflow-hidden border border-neutral-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
                       
                       {/* Left Side: Medical Bill */}
                       <div className="p-6 flex flex-col bg-transparent">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">
                                <FileText size={20} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="font-extrabold text-[#111111] text-base truncate">{claim.bill.name}</h4>
                                <p className="text-xs text-neutral-400 mt-0.5">Medical Bill • {claim.bill.fileSize}</p>
                             </div>
                             <div className="flex items-center gap-2">
                               <StatusBadge label={statusConfig[claim.bill.status]?.label || "Upload"} variant={statusConfig[claim.bill.status]?.variant || "neutral"} />
                               <button 
                                  onClick={() => handleDelete(claim.bill.id, claim.bill.name)}
                                  disabled={linking}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:bg-danger/10 hover:text-danger transition-colors"
                                  title="Delete Bill"
                               >
                                  <Trash2 size={14} />
                               </button>
                             </div>
                          </div>
                          
                          <div className="flex-1">
                            {renderExtractedData(claim.bill, claim.bill.extractedData ? JSON.parse(claim.bill.extractedData) : null)}
                          </div>
                          
                          {/* Settle Claim Action */}
                          {claim.bill.status === "ready" && (
                            <div className="mt-6 pt-4 border-t border-neutral-100">
                               <Link
                                  href={`/assistant?billId=${encodeURIComponent(claim.bill.id)}&label=${encodeURIComponent(claim.bill.name)}`}
                                  className="mb-2 w-full flex items-center justify-center gap-2 text-xs font-medium text-accent bg-accent/5 hover:bg-accent/10 py-2 rounded-lg transition-colors"
                               >
                                  <MessageSquareText size={14} /> Ask AI About This Bill
                               </Link>
                               <button 
                                  onClick={() => handleSettle(claim.bill.id)}
                                  disabled={linking}
                                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-charcoal hover:bg-charcoal-light py-2.5 rounded-xl transition-colors shadow-sm"
                               >
                                  <ArchiveRestore size={16} /> Mark Claim as Settled
                               </button>
                            </div>
                          )}
                       </div>

                       {/* Right Side: EOB Binding */}
                       <div className="p-5 relative flex flex-col">
                          {claim.eob ? (
                             // Render Linked EOB
                             <div className="flex-1 flex flex-col">
                                <div className="absolute top-5 -left-[14px] bg-white border border-neutral-100 p-1 rounded-full text-accent shadow-sm z-10 hidden md:block">
                                  <LinkIcon size={14} />
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                   <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
                                      <Receipt size={20} />
                                   </div>
                                   <div className="flex-1 min-w-0 flex items-center gap-2">
                                      <h4 className="font-extrabold text-[#111111] text-base truncate">{claim.eob.name}</h4>
                                      <span className="bg-success text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0">Linked</span>
                                   </div>
                                   
                                   {/* Unlink Action */}
                                   <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                                      <button 
                                        onClick={() => handleUnlink(claim.eob.id)}
                                        disabled={linking}
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:bg-warning/10 hover:text-warning transition-colors"
                                        title="Unlink EOB"
                                      >
                                        <Unlink size={14} />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(claim.eob.id, claim.eob.name)}
                                        disabled={linking}
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:bg-danger/10 hover:text-danger transition-colors"
                                        title="Delete EOB"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                   </div>
                                </div>
                                
                                <div className="flex-1">
                                   {renderExtractedData(claim.eob, claim.eob.extractedData ? JSON.parse(claim.eob.extractedData) : null)}
                                </div>
                             </div>
                          ) : (
                             // Render Unassigned State & Binding Dropdown
                             <div className="h-full flex flex-col justify-center items-center text-center p-4 py-8">
                                <Receipt size={28} className="text-neutral-300 mb-3" />
                                <h4 className="text-sm font-semibold text-charcoal mb-1">No EOB Linked</h4>
                                <p className="text-xs text-neutral-500 max-w-[200px] mb-4">Upload the matching Explanation of Benefits to unlock full financial context.</p>
                                
                                {unlinkedEobs.length > 0 && (
                                   <div className="w-full max-w-[240px]">
                                      <select 
                                        className="w-full text-sm border-neutral-200 rounded-lg focus:ring-accent focus:border-accent py-2 px-3 shadow-sm bg-white disabled:opacity-50"
                                        onChange={(e) => handleLink(claim.bill.id, e.target.value)}
                                        value=""
                                        disabled={linking}
                                      >
                                        <option value="" disabled>Select unassigned EOB...</option>
                                        {unlinkedEobs.map(e => (
                                          <option key={e.id} value={e.id}>{e.name} ({e.fileSize})</option>
                                        ))}
                                      </select>
                                   </div>
                                )}
                             </div>
                          )}
                       </div>

                    </div>
                  </div>
               </AnimateIn>
            ))}

             {/* Display Orphaned Unassigned EOBs */}
            {unlinkedEobs.length > 0 && (
               <div className="mt-10">
                 <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-5">Unassigned EOBs</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   {unlinkedEobs.map((eob) => (
                      <div key={eob.id} className="card-base border border-neutral-100 bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
                         <div className="flex items-center gap-3 mb-4">
                             <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">
                                <Receipt size={20} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="font-extrabold text-[#111111] text-base truncate">{eob.name}</h4>
                                <p className="text-xs text-neutral-400 mt-0.5">Unlinked EOB • {eob.fileSize}</p>
                             </div>
                             <div className="flex items-center gap-2">
                               <StatusBadge label={statusConfig[eob.status]?.label || "Ready"} variant={statusConfig[eob.status]?.variant || "neutral"} />
                               <button 
                                  onClick={() => handleDelete(eob.id, eob.name)}
                                  disabled={linking}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:bg-danger/10 hover:text-danger transition-colors"
                                  title="Delete EOB"
                               >
                                  <Trash2 size={14} />
                               </button>
                             </div>
                          </div>
                          {renderExtractedData(eob, eob.extractedData ? JSON.parse(eob.extractedData) : null)}

                          {unlinkedBills.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-neutral-100">
                               <p className="text-xs font-semibold text-charcoal mb-2">Link manually to unassigned Bill:</p>
                               <select 
                                  className="w-full text-sm border-neutral-200 rounded-lg focus:ring-accent focus:border-accent py-2 px-3 shadow-sm bg-white disabled:opacity-50"
                                  onChange={(e) => handleLink(e.target.value, eob.id)}
                                  value=""
                                  disabled={linking}
                                >
                                  <option value="" disabled>Select unassigned Bill...</option>
                                  {unlinkedBills.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                  ))}
                                </select>
                            </div>
                          )}
                      </div>
                   ))}
                 </div>
               </div>
            )}
            
          </div>
        )}
      </div>

      {/* ARCHIVED Claims Section */}
      {settledClaims.length > 0 && (
        <div className="pt-8 border-t border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-500 mb-4 flex items-center gap-2">
            <Archive className="text-neutral-400" size={20} /> Settled & Archived Claims
          </h2>
          <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
            {settledClaims.map((claim, idx) => (
               <div key={claim.bill.id} className="card-base p-0 overflow-hidden border border-neutral-200 bg-white">
                 <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
                    
                    {/* Left Side: Medical Bill */}
                    <div className="p-4 px-5">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500">
                             <FileText size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="font-extrabold text-[#111111] text-base truncate text-neutral-400 line-through decoration-neutral-300">{claim.bill.name}</h4>
                             <p className="text-xs text-neutral-400 mt-0.5">Settled Bill</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-neutral-100 text-neutral-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-neutral-200">Historical</span>
                            <button 
                                  onClick={() => handleUnsettle(claim.bill.id)}
                                  disabled={linking}
                                  className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:bg-success/10 hover:text-success transition-colors"
                                  title="Restore to Active"
                               >
                                  <ArchiveRestore size={12} />
                            </button>
                            <button 
                                  onClick={() => handleDelete(claim.bill.id, claim.bill.name)}
                                  disabled={linking}
                                  className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:bg-danger/10 hover:text-danger transition-colors"
                                  title="Delete Settled Bill"
                               >
                                  <Trash2 size={12} />
                            </button>
                          </div>
                       </div>
                       {renderExtractedData(claim.bill, claim.bill.extractedData ? JSON.parse(claim.bill.extractedData) : null)}
                    </div>

                    {/* Right Side: Linked EOB (if any) */}
                    <div className="p-4 px-5 relative">
                       {claim.eob ? (
                          <div>
                            <div className="absolute top-4 -left-[14px] bg-neutral-100 border border-neutral-200 p-1 rounded-full text-neutral-400 shadow-sm z-10 hidden md:block">
                              <LinkIcon size={14} />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                               <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-500">
                                  <Receipt size={16} />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="font-extrabold text-[#111111] text-base truncate text-neutral-600 line-through decoration-neutral-300">{claim.eob.name}</h4>
                                  <p className="text-xs text-neutral-400 mt-0.5">Settled EOB</p>
                               </div>
                               <button 
                                  onClick={() => handleDelete(claim.eob.id, claim.eob.name)}
                                  disabled={linking}
                                  className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:bg-danger/10 hover:text-danger transition-colors"
                                  title="Delete Settled EOB"
                               >
                                  <Trash2 size={12} />
                               </button>
                            </div>
                            {renderExtractedData(claim.eob, claim.eob.extractedData ? JSON.parse(claim.eob.extractedData) : null)}
                          </div>
                       ) : (
                          <div className="h-full flex flex-col justify-center items-center text-center py-4">
                             <Receipt size={24} className="text-neutral-300 mb-2" />
                             <h4 className="text-xs font-semibold text-neutral-400">No EOB on record</h4>
                          </div>
                       )}
                    </div>

                 </div>
               </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

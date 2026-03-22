import { UploadedDocument } from "@/types";

export const mockDocuments: UploadedDocument[] = [
  {
    id: "doc-1",
    name: "ISO_Student_Insurance_2026_Summary.pdf",
    type: "insurance_plan",
    status: "ready",
    uploadedAt: "2026-02-15T09:00:00Z",
    fileSize: "2.4 MB",
    extractedData: {
      planName: "ISO Student Insurance",
      deductible: 2000,
      outOfPocketMax: 6500,
      coverage: "Comprehensive medical, dental, vision",
    },
  },
  {
    id: "doc-2",
    name: "EOB_Dr_Martinez_Feb2026.pdf",
    type: "eob",
    status: "ready",
    uploadedAt: "2026-03-05T14:30:00Z",
    fileSize: "856 KB",
    extractedData: {
      planName: "ISO Student Insurance",
      deductible: 185,
      outOfPocketMax: 37,
      coverage: "Office visit — Primary Care",
    },
  },
  {
    id: "doc-3",
    name: "Lab_Invoice_Quest_Mar2026.pdf",
    type: "medical_bill",
    status: "analyzing",
    uploadedAt: "2026-03-18T11:15:00Z",
    fileSize: "1.1 MB",
  },
  {
    id: "doc-4",
    name: "MRI_Estimate_RadiologyGroup.pdf",
    type: "estimate",
    status: "ready",
    uploadedAt: "2026-03-19T16:45:00Z",
    fileSize: "420 KB",
    extractedData: {
      planName: "ISO Student Insurance",
      deductible: 850,
      outOfPocketMax: 170,
      coverage: "Diagnostic imaging — MRI knee",
    },
  },
  {
    id: "doc-5",
    name: "Prescription_Summary_Q1.pdf",
    type: "medical_bill",
    status: "error",
    uploadedAt: "2026-03-20T08:00:00Z",
    fileSize: "310 KB",
  },
];


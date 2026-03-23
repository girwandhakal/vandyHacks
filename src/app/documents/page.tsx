import { getDocuments } from "@/lib/server/documents";
import { DocumentsPageClient } from "@/app/documents/documents-page-client";

export default async function DocumentsPage() {
  const initialDocuments = await getDocuments();

  return <DocumentsPageClient initialDocuments={initialDocuments} />;
}

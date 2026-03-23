import { AssistantPageClient } from "@/app/assistant/assistant-page-client";

type AssistantPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AssistantPage({ searchParams }: AssistantPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeBillId = getSearchParam(resolvedSearchParams, "billId") ?? null;
  const activeBillLabel = getSearchParam(resolvedSearchParams, "label") || "Selected medical bill";

  return (
    <AssistantPageClient
      activeBillId={activeBillId}
      activeBillLabel={activeBillLabel}
    />
  );
}

import { mockVisitTypes } from "@/lib/mock/cost-estimator";
import { getCostEstimatorOptions } from "@/lib/server/cost-estimator";
import { CostEstimatorPageClient } from "@/app/cost-estimator/cost-estimator-page-client";

export default async function CostEstimatorPage() {
  const initialSelectedVisit = mockVisitTypes[0];
  const initialInNetwork = true;
  const initialOptions = await getCostEstimatorOptions(initialSelectedVisit, initialInNetwork);

  return (
    <CostEstimatorPageClient
      initialSelectedVisit={initialSelectedVisit}
      initialInNetwork={initialInNetwork}
      initialOptions={initialOptions}
    />
  );
}

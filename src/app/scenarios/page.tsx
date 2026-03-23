import { mockProcedures } from "@/lib/mock/scenarios";
import { getScenarioEstimate } from "@/lib/server/scenarios";
import { ScenariosPageClient } from "@/app/scenarios/scenarios-page-client";

export default async function ScenariosPage() {
  const initialProcedure = mockProcedures[0];
  const initialScenario = await getScenarioEstimate(initialProcedure);

  return (
    <ScenariosPageClient
      initialProcedure={initialProcedure}
      initialScenario={initialScenario}
    />
  );
}

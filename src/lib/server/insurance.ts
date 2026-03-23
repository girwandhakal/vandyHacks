import { cache } from "react";
import { getInsurancePlanRecord } from "@/lib/server/core";

export const getInsurancePlan = cache(async () => getInsurancePlanRecord());

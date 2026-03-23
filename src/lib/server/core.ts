import { cache } from "react";
import { prisma } from "@/lib/db";

export const getCurrentUser = cache(async () => prisma.user.findFirst());

export const getInsurancePlanRecord = cache(async () => prisma.insurancePlan.findFirst());

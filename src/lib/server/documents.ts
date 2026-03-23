import { cache } from "react";
import { prisma } from "@/lib/db";

export const getDocuments = cache(async () =>
  prisma.document.findMany({
    orderBy: { uploadedAt: "desc" },
  }),
);

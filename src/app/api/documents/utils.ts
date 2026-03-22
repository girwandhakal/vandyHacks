import { prisma } from "@/lib/db";

export async function recalculateFinancials() {
  const plan = await prisma.insurancePlan.findFirst();
  if (!plan) return;

  const settledBills = await prisma.document.findMany({
    where: { type: "medical_bill", isSettled: true } as any
  });

  const allEobs = await prisma.document.findMany({
    where: { type: "eob" }
  });

  let totalApplied = 0;

  for (const bill of settledBills) {
    const eob = allEobs.find(e => (e as any).linkedBillId === bill.id);
    const docData = eob ? eob.extractedData : bill.extractedData;
    
    if (docData) {
      try {
        const data = JSON.parse(docData);
        // The patient responsibility amount applies to BOTH deductible and OOP Max
        const amount = Number(data.patientResponsibility || data.outOfPocket || data.oop || data.outOfPocketMax || data.totalAmount || 0);
        totalApplied += amount;
      } catch(e) {
        console.error("Error parsing document data:", e);
      }
    }
  }

  await prisma.insurancePlan.update({
    where: { id: plan.id },
    data: {
      deductibleMetIndiv: Math.min(plan.deductibleIndiv, totalApplied),
      oopSpentIndiv: Math.min(plan.oopMaxIndiv, totalApplied)
    }
  });
}

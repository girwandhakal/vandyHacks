import { prisma } from "@/lib/db";

export async function recalculateFinancials() {
  const plan = await prisma.insurancePlan.findFirst();
  if (!plan) return;

  const settledBills = await prisma.medicalBill.findMany({
    where: { status: "paid" },
    include: {
      eobLinks: {
        include: { eob: true },
      },
    },
  });

  let totalApplied = 0;

  for (const bill of settledBills) {
    const eob = bill.eobLinks[0]?.eob;
    const amount = Number(eob?.patientResponsibility || bill.patientResponsibility || bill.currentBalance || 0);
    totalApplied += amount;
  }

  await prisma.insurancePlan.update({
    where: { id: plan.id },
    data: {
      deductibleMetIndiv: Math.min(plan.deductibleIndiv, totalApplied),
      oopSpentIndiv: Math.min(plan.oopMaxIndiv, totalApplied)
    }
  });
}

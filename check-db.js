const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const plan = await prisma.insurancePlan.findFirst();
  const latestDoc = await prisma.document.findFirst({
    where: { type: "insurance_plan", status: "ready" },
    orderBy: { uploadedAt: "desc" }
  });

  const obj = { plan, latestDoc, hasTxt: false, txtSample: null };

  if (latestDoc && latestDoc.filePath) {
    const txtPath = require('path').join(process.cwd(), latestDoc.filePath + ".txt");
    if (fs.existsSync(txtPath)) {
      obj.hasTxt = true;
      obj.txtSample = fs.readFileSync(txtPath, "utf-8").substring(0, 200);
    } else {
        obj.txtPathAttempted = txtPath;
    }
  }

  console.log(JSON.stringify(obj, null, 2));
}
run().finally(() => process.exit(0));

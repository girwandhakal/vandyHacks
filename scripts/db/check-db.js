const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const projectRoot = path.resolve(__dirname, '..', '..');

async function run() {
  const plan = await prisma.insurancePlan.findFirst();
  const latestDoc = await prisma.document.findFirst({
    where: { type: "insurance_plan", status: "ready" },
    orderBy: { uploadedAt: "desc" }
  });

  const obj = { plan, latestDoc, hasTxt: false, txtSample: null };

  if (latestDoc && latestDoc.filePath) {
    const relativeFilePath = latestDoc.filePath.replace(/^[/\\]+/, '');
    const txtPath = path.join(projectRoot, `${relativeFilePath}.txt`);
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

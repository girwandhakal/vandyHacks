const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const outputDir = path.resolve(__dirname, '..', 'output');
const outputPath = path.join(outputDir, 'plan_out.json');

prisma.insurancePlan.findFirst().then(p => {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(p, null, 2), 'utf8');
  console.log(`Wrote ${outputPath}`);
}).finally(() => prisma.$disconnect());

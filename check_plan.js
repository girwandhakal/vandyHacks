const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.insurancePlan.findFirst().then(p => {
  require('fs').writeFileSync('plan_out.json', JSON.stringify(p, null, 2), 'utf8');
}).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const result = await prisma.document.updateMany({
    where: { status: 'analyzing' },
    data: { status: 'error' }
  });
  console.log(`Fixed ${result.count} stuck documents.`);
}
run().finally(() => prisma.$disconnect());

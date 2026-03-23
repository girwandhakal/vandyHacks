const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    console.log("Connecting to DB...");
    const user = await prisma.user.findFirst();
    console.log("User:", user);
    
    const count = await prisma.user.count();
    console.log("User count:", count);
  } catch(e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

check();

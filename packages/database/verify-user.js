require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = process.env.AGENTBAZAAR_DB_URL;
  const prisma = new PrismaClient({
    datasources: { db: { url: url } }
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'ultravioletadewale@gmail.com' },
      select: { email: true }
    });
    console.log(`User Verification: ${JSON.stringify(user)}`);
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

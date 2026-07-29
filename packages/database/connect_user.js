const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const email = 'meedex42@gmail.com';
  const walletAddress = '0xD228E7294BC6e265CdC87443DF0643a5F3D7daDD3';
  const passwordHash = '$2a$12$sL.j.Q38iVPuF9FJUeOPSGeh9LJp3Cl3CqyvOjeF6e'; // password123

  console.log(`Resetting user ${email} and connecting wallet...`);
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { 
        walletAddress,
        passwordHash,
        emailVerified: true,
        onboardingCompleted: true
      },
      create: {
        email,
        username: 'meedex42',
        passwordHash,
        walletAddress,
        emailVerified: true,
        onboardingCompleted: true
      }
    });
    console.log('SUCCESS: User fully prepared for testing:', user.id);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();

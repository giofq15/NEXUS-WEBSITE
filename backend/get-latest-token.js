require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check() {
  const token = await prisma.passwordResetToken.findFirst({
    where: { user: { email: 'admin@nexus.com' } },
    orderBy: { createdAt: 'desc' },
  });

  if (token) {
    console.log('\n✓ Token mais recente:');
    console.log('Token completo:', token.token);
    console.log('Link:', `http://localhost:3000/views/public/forgot-password.html?token=${token.token}`);
  } else {
    console.log('Nenhum token encontrado');
  }

  await prisma.$disconnect();
}

check();

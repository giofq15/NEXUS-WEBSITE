require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check() {
  const tokens = await prisma.passwordResetToken.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('✓ Últimos 5 tokens de reset:');
  tokens.forEach((token, idx) => {
    console.log(`\n${idx + 1}. Usuário: ${token.user.email}`);
    console.log(`   Token: ${token.token.substring(0, 20)}...`);
    console.log(`   Expira em: ${token.expiresAt}`);
    console.log(`   Criado em: ${token.createdAt}`);
  });

  await prisma.$disconnect();
}

check();

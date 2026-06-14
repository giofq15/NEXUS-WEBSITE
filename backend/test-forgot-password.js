require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testForgotPassword() {
  try {
    console.log('🧪 Testando forgot password...');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);

    const email = 'admin@nexus.com';
    console.log('\n📧 Procurando usuário com email:', email);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log('⚠️  Usuário não encontrado');
      return;
    }

    console.log('✓ Usuário encontrado:', user.email);

    // Gerar token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    console.log('🔑 Gerando token...');
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log('✓ Token criado com sucesso');

    // Testar email
    console.log('\n📧 Testando envio de email...');
    const { sendPasswordResetEmail } = require('./src/utils/email');
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/views/public/forgot-password.html?token=${token}`;

    console.log('📤 Enviando email para:', user.email);
    console.log('🔗 URL de reset:', resetUrl.substring(0, 80) + '...');

    await sendPasswordResetEmail(user.email, token, resetUrl);
    console.log('✓ Email enviado com sucesso!');

    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testForgotPassword();

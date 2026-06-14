const nodemailer = require('nodemailer');

// Configurar o transporte de email
// Para desenvolvimento, você pode usar um serviço de teste como Mailtrap
// Para produção, configure as credenciais do seu servidor de email

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verificar conexão (opcional, apenas para debug)
if (process.env.NODE_ENV === 'development') {
  transporter.verify((error) => {
    if (error) {
      console.warn('Aviso: Verificação de email falhou. Configure EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD no .env');
    } else {
      console.log('✓ Serviço de email configurado com sucesso');
    }
  });
}

/**
 * Enviar email de reset de senha
 * @param {string} email - Email do usuário
 * @param {string} resetToken - Token de reset
 * @param {string} resetUrl - URL completa para redefinir a senha
 */
async function sendPasswordResetEmail(email, resetToken, resetUrl) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@nexus.com',
      to: email,
      subject: 'Redefinir sua senha - NEXUS',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background-color: #1b2c48; color: white; padding: 20px; text-align: center; border-radius: 5px;">
            <h1 style="margin: 0;">NEXUS</h1>
          </div>
          
          <div style="padding: 20px; max-width: 600px;">
            <h2>Recuperação de Senha</h2>
            
            <p>Olá,</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta NEXUS. Se você não fez esta solicitação, pode ignorar este e-mail.</p>
            
            <p>Para redefinir sua senha, clique no link abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #ff6600; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Redefinir Senha
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px;">
              Ou copie este link no seu navegador:<br>
              <code style="background-color: #f5f5f5; padding: 10px; display: block; margin: 10px 0; word-break: break-all;">
                ${resetUrl}
              </code>
            </p>
            
            <p style="color: #666; font-size: 12px;">
              <strong>⚠️ Importante:</strong> Este link expira em 1 hora. Se você não conseguir redefinir sua senha a tempo, solicite um novo link de redefinição.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
              Se você não solicitou uma redefinição de senha, simplesmente ignore este e-mail. Sua conta está segura.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} NEXUS. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `,
      text: `
        Recuperação de Senha - NEXUS

        Olá,

        Recebemos uma solicitação para redefinir a senha da sua conta NEXUS.

        Para redefinir sua senha, acesse este link:
        ${resetUrl}

        Este link expira em 1 hora.

        Se você não solicitou uma redefinição de senha, ignore este e-mail.

        © ${new Date().getFullYear()} NEXUS.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email de reset de senha enviado:', info.response);
    return true;
  } catch (error) {
    console.error('✗ Erro ao enviar email:', error);
    throw error;
  }
}

module.exports = {
  sendPasswordResetEmail,
  transporter,
};

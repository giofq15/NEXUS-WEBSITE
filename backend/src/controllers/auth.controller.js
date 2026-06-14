const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken, generateRefreshToken, refreshTokenExpiresAt } = require('../utils/jwt');

const prisma = new PrismaClient();

function buildUserPayload(user) {
  const colaboradorId = user.colaborador?.id || null;
  const moradorId = user.morador?.id || null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    accessLevel: user.accessLevel,
    colaboradorId,
    moradorId,
  };
}

function normalizePortal(portal) {
  return portal === 'admin' ? 'admin' : 'colaborador';
}

function isAdminPortalUser(user) {
  return user.accessLevel === 'ROOT' || user.accessLevel === 'ADMIN' || user.role === 'ADMIN';
}

function isColaboradorPortalUser(user) {
  return user.accessLevel === 'COLABORADOR' || user.role === 'COLABORADOR';
}

function canAccessPortal(user, portal) {
  return portal === 'admin' ? isAdminPortalUser(user) : isColaboradorPortalUser(user);
}

function portalAccessError(portal) {
  return portal === 'admin'
    ? 'Use uma conta de administrador para acessar este portal'
    : 'Use uma conta de colaborador para acessar este portal';
}

async function issueAuthForUser(user) {
  const condominio = await prisma.condominio.findUnique({ where: { id: 1 } });
  const payload = buildUserPayload(user);
  const accessToken = generateToken(payload);

  const rawRefresh = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: rawRefresh,
      expiresAt: refreshTokenExpiresAt(),
    },
  });

  const nomeCondominio = condominio?.nome || 'NEXUS';

  return {
    token: accessToken,
    refreshToken: rawRefresh,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      accessLevel: user.accessLevel,
      nome: user.colaborador?.nome || user.morador?.nome || 'Administrador',
      colaboradorId: payload.colaboradorId,
      moradorId: payload.moradorId,
      bloco: user.morador?.bloco || user.colaborador?.bloco || null,
      unidade: user.morador?.unidade || user.colaborador?.unidade || null,
      nomeCondominio,
    },
  };
}

async function findUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  return prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { colaborador: true, morador: true },
  });
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const portal = normalizePortal(req.body.portal || req.body.role);

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha invalidos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'E-mail ou senha invalidos' });
    }

    if (!canAccessPortal(user, portal)) {
      return res.status(403).json({ error: portalAccessError(portal) });
    }

    const authData = await issueAuthForUser(user);
    res.json(authData);
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function loginWithGoogle(req, res) {
  try {
    const { idToken, accessToken } = req.body;
    const portal = normalizePortal(req.body.portal || req.body.role);
    if (!idToken && !accessToken) {
      return res.status(400).json({ error: 'idToken ou accessToken é obrigatório' });
    }

    let tokenInfo;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (idToken) {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      tokenInfo = await response.json();
      if (!response.ok || tokenInfo.error_description) {
        return res.status(401).json({ error: 'Token Google inválido' });
      }
    } else {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
      );
      tokenInfo = await response.json();
      if (!response.ok || tokenInfo.error_description) {
        return res.status(401).json({ error: 'Access token Google inválido' });
      }
    }

    const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === 'true';
    if (!emailVerified) {
      return res.status(401).json({ error: 'Conta Google sem e-mail verificado' });
    }

    if (googleClientId && tokenInfo.aud && tokenInfo.aud !== googleClientId) {
      return res.status(401).json({ error: 'Token Google com client_id inválido' });
    }

    const user = await findUserByEmail(tokenInfo.email);
    if (!user) {
      return res.status(403).json({ error: 'Conta não autorizada. Solicite cadastro ao administrador.' });
    }

    if (!canAccessPortal(user, portal)) {
      return res.status(403).json({ error: portalAccessError(portal) });
    }

    const authData = await issueAuthForUser(user);
    res.json(authData);
  } catch (error) {
    console.error('Erro no login Google:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function loginWithFacebook(req, res) {
  try {
    const { accessToken } = req.body;
    const portal = normalizePortal(req.body.portal || req.body.role);
    if (!accessToken) {
      return res.status(400).json({ error: 'accessToken é obrigatório' });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appId || !appSecret) {
      return res.status(500).json({ error: 'Facebook OAuth não configurado no servidor' });
    }

    const appAccessToken = `${appId}|${appSecret}`;

    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`
    );
    const debugJson = await debugRes.json();
    const debugData = debugJson?.data;

    if (!debugRes.ok || !debugData?.is_valid || debugData.app_id !== appId) {
      return res.status(401).json({ error: 'Token Facebook inválido' });
    }

    const meRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`
    );
    const me = await meRes.json();
    if (!meRes.ok || !me?.id) {
      return res.status(401).json({ error: 'Falha ao obter dados do Facebook' });
    }

    if (!me.email) {
      return res.status(400).json({
        error: 'Facebook não retornou e-mail. Use Google ou login por senha.',
      });
    }

    const user = await findUserByEmail(me.email);
    if (!user) {
      return res.status(403).json({ error: 'Conta não autorizada. Solicite cadastro ao administrador.' });
    }

    if (!canAccessPortal(user, portal)) {
      return res.status(403).json({ error: portalAccessError(portal) });
    }

    const authData = await issueAuthForUser(user);
    res.json(authData);
  } catch (error) {
    console.error('Erro no login Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken e obrigatorio' });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { colaborador: true, morador: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      return res.status(401).json({ error: 'Refresh token invalido ou expirado' });
    }

    const payload = buildUserPayload(stored.user);
    const newAccessToken = generateToken(payload);

    // Rotaciona o refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const newRawRefresh = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        token: newRawRefresh,
        expiresAt: refreshTokenExpiresAt(),
      },
    });

    res.json({ token: newAccessToken, refreshToken: newRawRefresh });
  } catch (error) {
    console.error('Erro no refresh:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

function oauthConfig(req, res) {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    facebookAppId: process.env.FACEBOOK_APP_ID || null,
  });
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    console.log('🔄 Forgot password request for:', normalizedEmail);

    // Encontrar usuário
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Por segurança, sempre retornar mensagem de sucesso mesmo se usuário não existir
    if (!user) {
      console.log('⚠️  Usuário não encontrado:', normalizedEmail);
      return res.json({
        message: 'Se o e-mail existir em nossa base de dados, você receberá um link de redefinição',
      });
    }

    console.log('✓ Usuário encontrado:', user.email);

    // Limpar tokens antigos expirados
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    });

    // Gerar novo token (válido por 1 hora)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    const resetTokenRecord = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log('✓ Token criado:', token.substring(0, 10) + '...');

    // Enviar email com link de reset
    try {
      const { sendPasswordResetEmail } = require('../utils/email');
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/views/public/forgot-password.html?token=${token}`;
      
      console.log('📧 Enviando email para:', user.email);
      await sendPasswordResetEmail(user.email, token, resetUrl);
      console.log('✓ Email enviado com sucesso');
    } catch (emailError) {
      console.error('✗ Erro ao enviar email:', emailError.message);
      // Mesmo se o email falhar, retornar sucesso ao usuário por segurança
    }

    res.json({
      message: 'Se o e-mail existir em nossa base de dados, você receberá um link de redefinição',
    });
  } catch (error) {
    console.error('✗ Erro no forgot password:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    // Validações básicas
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    // Encontrar token válido
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Token inválido ou não encontrado' });
    }

    if (resetToken.expiresAt < new Date()) {
      // Deletar token expirado
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return res.status(400).json({ error: 'Link de redefinição expirou. Solicite um novo.' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha do usuário
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Deletar todos os tokens de reset desse usuário
    await prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    // Deletar todos os refresh tokens para forçar novo login
    await prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    res.json({ message: 'Senha redefinida com sucesso. Por favor, faça login novamente.' });
  } catch (error) {
    console.error('Erro no reset password:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { 
  login, 
  refresh, 
  logout, 
  loginWithGoogle, 
  loginWithFacebook, 
  oauthConfig,
  forgotPassword,
  resetPassword,
};

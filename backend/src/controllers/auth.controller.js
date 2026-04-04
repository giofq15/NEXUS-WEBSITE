const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
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

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { colaborador: true, morador: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha invalidos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'E-mail ou senha invalidos' });
    }

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

    res.json({
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
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
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

module.exports = { login, refresh, logout };

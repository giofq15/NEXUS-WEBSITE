const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateToken, generateRefreshToken } = require('../utils/jwt');

const prisma = new PrismaClient();

const REFRESH_EXPIRES_DAYS = 7;

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

    const colaboradorId = user.colaborador?.id || null;
    const moradorId = user.morador?.id || null;
    const nome = user.colaborador?.nome || user.morador?.nome || 'Administrador';

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      accessLevel: user.accessLevel,
      colaboradorId,
      moradorId,
    });

    const refreshTokenValue = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshTokenValue, expiresAt },
    });

    res.json({
      token,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accessLevel: user.accessLevel,
        nome,
        colaboradorId,
        moradorId,
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
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      return res.status(401).json({ error: 'Refresh token invalido ou expirado' });
    }

    const { user } = stored;
    const colaboradorId = user.colaborador?.id || null;
    const moradorId = user.morador?.id || null;

    const newToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      accessLevel: user.accessLevel,
      colaboradorId,
      moradorId,
    });

    // Rotate refresh token
    const newRefreshValue = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { token: newRefreshValue, expiresAt },
    });

    res.json({ token: newToken, refreshToken: newRefreshValue });
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

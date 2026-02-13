const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { morador: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      moradorId: user.morador?.id || null,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nome: user.morador?.nome || 'Administrador',
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { login };

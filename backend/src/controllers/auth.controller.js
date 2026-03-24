const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { colaborador: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha invalidos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'E-mail ou senha invalidos' });
    }

    const colaboradorId = user.colaborador?.id || null;

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      accessLevel: user.accessLevel,
      colaboradorId,
      moradorId: colaboradorId,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accessLevel: user.accessLevel,
        nome: user.colaborador?.nome || 'Administrador',
        colaboradorId,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { login };

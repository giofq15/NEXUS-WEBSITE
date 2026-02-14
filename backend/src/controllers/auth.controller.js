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


async function requestCadastro(req, res) {
  try {
    const { nome, cpf, nascimento, telefone, bloco, unidade, tipoMoradia, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const existingCpf = await prisma.morador.findUnique({ where: { cpf } });
    if (existingCpf) {
      return res.status(409).json({ error: 'CPF já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const morador = await prisma.morador.create({
      data: {
        nome,
        cpf,
        nascimento: nascimento ? new Date(nascimento) : null,
        telefone,
        bloco,
        unidade,
        tipoMoradia,
        status: 'PENDENTE',
        user: {
          create: {
            email,
            password: hashedPassword,
            role: 'MORADOR',
          },
        },
      },
      include: { user: { select: { email: true } } },
    });

    res.status(201).json({
      message: 'Solicitação de cadastro enviada com sucesso! Aguarde aprovação da administração.',
      data: {
        id: morador.id,
        nome: morador.nome,
        email: morador.user.email,
        status: morador.status,
        tipoMoradia: morador.tipoMoradia,
      },
    });
  } catch (error) {
    console.error('Erro ao solicitar cadastro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { login, requestCadastro };

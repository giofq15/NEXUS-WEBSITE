const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { isAdminLevel } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

async function me(req, res) {
  try {
    const moradorId = req.user.moradorId;
    if (!moradorId) {
      return res.status(403).json({ error: 'Usuario nao e um morador' });
    }

    const morador = await prisma.morador.findUnique({
      where: { id: moradorId },
      include: { user: { select: { email: true } } },
    });

    if (!morador) {
      return res.status(404).json({ error: 'Morador nao encontrado' });
    }

    res.json(morador);
  } catch (error) {
    console.error('Erro ao buscar perfil do morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function list(req, res) {
  try {
    const { search } = req.query;

    const where = search
      ? {
          OR: [
            { nome: { contains: search, mode: 'insensitive' } },
            { bloco: { contains: search, mode: 'insensitive' } },
            { unidade: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const moradores = await prisma.morador.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { nome: 'asc' },
    });

    res.json(moradores);
  } catch (error) {
    console.error('Erro ao listar moradores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!isAdminLevel(req.user) && req.user.moradorId !== id) {
      return res.status(403).json({ error: 'Sem permissao para acessar este morador' });
    }

    const morador = await prisma.morador.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });

    if (!morador) {
      return res.status(404).json({ error: 'Morador nao encontrado' });
    }

    res.json(morador);
  } catch (error) {
    console.error('Erro ao buscar morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const { nome, cpf, nascimento, telefone, bloco, unidade, status, email } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'E-mail ja cadastrado' });
    }

    const existingCpf = await prisma.morador.findUnique({ where: { cpf } });
    if (existingCpf) {
      return res.status(409).json({ error: 'CPF ja cadastrado' });
    }

    const hashedPassword = await bcrypt.hash('morador123', 10);

    const morador = await prisma.morador.create({
      data: {
        nome,
        cpf,
        nascimento: nascimento ? new Date(nascimento) : null,
        telefone,
        bloco,
        unidade,
        status: status || 'PENDENTE',
        user: {
          create: {
            email,
            password: hashedPassword,
            role: 'MORADOR',
            accessLevel: 'MORADOR',
          },
        },
      },
      include: { user: { select: { email: true } } },
    });

    res.status(201).json(morador);
  } catch (error) {
    console.error('Erro ao criar morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const { nome, cpf, nascimento, telefone, bloco, unidade, status, email } = req.body;

    const morador = await prisma.morador.findUnique({ where: { id } });
    if (!morador) {
      return res.status(404).json({ error: 'Morador nao encontrado' });
    }

    const updated = await prisma.morador.update({
      where: { id },
      data: {
        nome,
        cpf,
        nascimento: nascimento ? new Date(nascimento) : undefined,
        telefone,
        bloco,
        unidade,
        status,
        user: email ? { update: { email } } : undefined,
      },
      include: { user: { select: { email: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);

    const morador = await prisma.morador.findUnique({ where: { id } });
    if (!morador) {
      return res.status(404).json({ error: 'Morador nao encontrado' });
    }

    await prisma.user.delete({ where: { id: morador.userId } });

    res.json({ message: 'Morador removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { me, list, getById, create, update, remove };

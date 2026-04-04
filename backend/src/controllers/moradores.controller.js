const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function list(req, res) {
  try {
    const { search } = req.query;
    const where = search
      ? {
          OR: [
            { nome: { contains: search, mode: 'insensitive' } },
            { cpf: { contains: search } },
            { bloco: { contains: search, mode: 'insensitive' } },
            { unidade: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const moradores = await prisma.morador.findMany({
      where,
      include: { user: { select: { email: true, role: true } } },
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
    const id = parseInt(req.params.id);
    const morador = await prisma.morador.findUnique({
      where: { id },
      include: { user: { select: { email: true, role: true } } },
    });

    if (!morador) return res.status(404).json({ error: 'Morador nao encontrado' });

    // Non-admin can only view their own profile
    if (!isAdmin(req.user) && req.user.moradorId !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(morador);
  } catch (error) {
    console.error('Erro ao buscar morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const { nome, cpf, telefone, bloco, unidade, email } = req.body;

    const emailBase = email || `${nome.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@nexus.com`;

    const existing = await prisma.user.findUnique({ where: { email: emailBase } });
    if (existing) return res.status(409).json({ error: 'E-mail ja cadastrado' });

    const hashedPassword = await bcrypt.hash('morador123', 10);

    const morador = await prisma.morador.create({
      data: {
        nome,
        cpf,
        telefone,
        bloco,
        unidade,
        user: {
          create: {
            email: emailBase,
            password: hashedPassword,
            role: 'MORADOR',
            accessLevel: 'COLABORADOR',
          },
        },
      },
      include: { user: { select: { email: true, role: true } } },
    });

    res.status(201).json(morador);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'CPF ou e-mail ja cadastrado' });
    }
    console.error('Erro ao criar morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id);

    if (!isAdmin(req.user) && req.user.moradorId !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { nome, cpf, telefone, bloco, unidade, email } = req.body;

    const morador = await prisma.morador.findUnique({ where: { id } });
    if (!morador) return res.status(404).json({ error: 'Morador nao encontrado' });

    const updated = await prisma.morador.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(cpf && { cpf }),
        ...(telefone && { telefone }),
        ...(bloco && { bloco }),
        ...(unidade && { unidade }),
        ...(email && { user: { update: { email } } }),
      },
      include: { user: { select: { email: true } } },
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'CPF ou e-mail ja cadastrado' });
    }
    console.error('Erro ao atualizar morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id);
    const morador = await prisma.morador.findUnique({ where: { id } });
    if (!morador) return res.status(404).json({ error: 'Morador nao encontrado' });

    await prisma.user.delete({ where: { id: morador.userId } });
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

function isAdmin(user) {
  return user.accessLevel === 'ADMIN' || user.accessLevel === 'ROOT' || user.role === 'ADMIN';
}

module.exports = { list, getById, create, update, remove };

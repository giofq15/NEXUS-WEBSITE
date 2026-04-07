const { PrismaClient } = require('@prisma/client');
const { isAdminLevel } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

async function list(req, res) {
  try {
    const apenasAtivos = !isAdminLevel(req.user);

    const areas = await prisma.areaLazer.findMany({
      where: apenasAtivos ? { ativo: true } : {},
      orderBy: { nome: 'asc' },
    });

    res.json(areas);
  } catch (error) {
    console.error('Erro ao listar areas de lazer:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id);

    const area = await prisma.areaLazer.findUnique({ where: { id } });
    if (!area) {
      return res.status(404).json({ error: 'Area de lazer nao encontrada' });
    }

    res.json(area);
  } catch (error) {
    console.error('Erro ao buscar area de lazer:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const { nome, descricao, capacidade, ativo } = req.body;

    const area = await prisma.areaLazer.create({
      data: {
        nome,
        descricao,
        capacidade: capacidade ? Number(capacidade) : 50,
        ativo: ativo !== undefined ? Boolean(ativo) : true,
      },
    });

    res.status(201).json(area);
  } catch (error) {
    console.error('Erro ao criar area de lazer:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const { nome, descricao, capacidade, ativo } = req.body;

    const area = await prisma.areaLazer.findUnique({ where: { id } });
    if (!area) {
      return res.status(404).json({ error: 'Area de lazer nao encontrada' });
    }

    const updated = await prisma.areaLazer.update({
      where: { id },
      data: {
        nome,
        descricao,
        capacidade: capacidade != null ? Number(capacidade) : undefined,
        ativo: ativo != null ? Boolean(ativo) : undefined,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar area de lazer:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, getById, create, update };

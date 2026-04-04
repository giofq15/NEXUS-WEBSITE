const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function list(req, res) {
  try {
    const areas = await prisma.areaLazer.findMany({ orderBy: { nome: 'asc' } });
    res.json(areas);
  } catch (error) {
    console.error('Erro ao listar areas de lazer:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const area = await prisma.areaLazer.findUnique({ where: { id } });
    if (!area) return res.status(404).json({ error: 'Area nao encontrada' });
    res.json(area);
  } catch (error) {
    console.error('Erro ao buscar area:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const { nome, descricao, capacidade } = req.body;
    const area = await prisma.areaLazer.create({ data: { nome, descricao, capacidade } });
    res.status(201).json(area);
  } catch (error) {
    console.error('Erro ao criar area:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { nome, descricao, capacidade } = req.body;
    const area = await prisma.areaLazer.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(capacidade && { capacidade }),
      },
    });
    res.json(area);
  } catch (error) {
    console.error('Erro ao atualizar area:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id);
    await prisma.areaLazer.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover area:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, getById, create, update, remove };

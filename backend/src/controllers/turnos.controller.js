const { PrismaClient } = require('@prisma/client');
const { isAdminLevel } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

function getActorColaboradorId(user) {
  return user.colaboradorId || user.moradorId || null;
}

async function list(req, res) {
  try {
    const logs = await prisma.turnoLog.findMany({
      include: {
        colaborador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(logs);
  } catch (error) {
    console.error('Erro ao listar turnos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const colaboradorId = getActorColaboradorId(req.user);
    const { turno, resumo, pendencias, orientacoes } = req.body;

    const created = await prisma.turnoLog.create({
      data: {
        colaboradorId: colaboradorId || null,
        turno,
        resumo,
        pendencias: pendencias || null,
        orientacoes: orientacoes || null,
      },
      include: {
        colaborador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Erro ao criar registro de turno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const { turno, resumo, pendencias, orientacoes } = req.body;
    const current = await prisma.turnoLog.findUnique({ where: { id } });

    if (!current) {
      return res.status(404).json({ error: 'Registro de turno nao encontrado' });
    }

    const actorId = getActorColaboradorId(req.user);
    if (!isAdminLevel(req.user) && current.colaboradorId && current.colaboradorId !== actorId) {
      return res.status(403).json({ error: 'Sem permissao para editar este registro' });
    }

    const updated = await prisma.turnoLog.update({
      where: { id },
      data: {
        turno,
        resumo,
        pendencias: pendencias || null,
        orientacoes: orientacoes || null,
      },
      include: {
        colaborador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar registro de turno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    const current = await prisma.turnoLog.findUnique({ where: { id } });

    if (!current) {
      return res.status(404).json({ error: 'Registro de turno nao encontrado' });
    }

    const actorId = getActorColaboradorId(req.user);
    if (!isAdminLevel(req.user) && current.colaboradorId && current.colaboradorId !== actorId) {
      return res.status(403).json({ error: 'Sem permissao para excluir este registro' });
    }

    await prisma.turnoLog.delete({ where: { id } });
    res.json({ message: 'Registro de turno removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover registro de turno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, create, update, remove };

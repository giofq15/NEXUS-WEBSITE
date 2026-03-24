const { PrismaClient } = require('@prisma/client');
const { isAdminLevel } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

function getActorColaboradorId(user) {
  return user.colaboradorId || user.moradorId || null;
}

function normalizePriority(priority) {
  const value = String(priority || '').toUpperCase();
  if (value === 'ALTA' || value === 'MEDIA' || value === 'BAIXA') {
    return value;
  }
  return 'MEDIA';
}

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'EM_ANALISE' || value === 'EM_ANDAMENTO' || value === 'RESOLVIDA') {
    return value;
  }
  return 'EM_ANALISE';
}

async function list(req, res) {
  try {
    const { status, prioridade } = req.query;

    const where = {};
    if (status) {
      where.status = normalizeStatus(status);
    }
    if (prioridade) {
      where.prioridade = normalizePriority(prioridade);
    }

    if (!isAdminLevel(req.user)) {
      const colaboradorId = getActorColaboradorId(req.user);
      if (!colaboradorId) {
        return res.status(403).json({ error: 'Usuario colaborador invalido' });
      }
      where.colaboradorId = colaboradorId;
    }

    const ocorrencias = await prisma.ocorrencia.findMany({
      where,
      include: {
        colaborador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(ocorrencias);
  } catch (error) {
    console.error('Erro ao listar ocorrencias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id);

    const ocorrencia = await prisma.ocorrencia.findUnique({
      where: { id },
      include: {
        colaborador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
    });

    if (!ocorrencia) {
      return res.status(404).json({ error: 'Ocorrencia nao encontrada' });
    }

    if (!isAdminLevel(req.user) && ocorrencia.colaboradorId !== getActorColaboradorId(req.user)) {
      return res.status(403).json({ error: 'Sem permissao para acessar esta ocorrencia' });
    }

    res.json(ocorrencia);
  } catch (error) {
    console.error('Erro ao buscar ocorrencia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const { tipo, local, descricao, prioridade, status, colaboradorId, moradorId } = req.body;

    let targetColaboradorId = null;
    if (isAdminLevel(req.user)) {
      const requestedId = colaboradorId != null ? colaboradorId : moradorId;
      if (requestedId != null) {
        targetColaboradorId = Number(requestedId);
      }
    } else {
      const actorColaboradorId = getActorColaboradorId(req.user);
      if (!actorColaboradorId) {
        return res.status(403).json({ error: 'Usuario colaborador invalido' });
      }
      targetColaboradorId = actorColaboradorId;
    }

    if (targetColaboradorId) {
      const colaboradorExists = await prisma.colaborador.findUnique({ where: { id: targetColaboradorId } });
      if (!colaboradorExists) {
        return res.status(404).json({ error: 'Colaborador informado nao encontrado' });
      }
    }

    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        colaboradorId: targetColaboradorId,
        tipo,
        local,
        descricao,
        prioridade: normalizePriority(prioridade),
        status: normalizeStatus(status),
      },
      include: {
        colaborador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
    });

    res.status(201).json(ocorrencia);
  } catch (error) {
    console.error('Erro ao criar ocorrencia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function updateStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const ocorrencia = await prisma.ocorrencia.findUnique({ where: { id } });
    if (!ocorrencia) {
      return res.status(404).json({ error: 'Ocorrencia nao encontrada' });
    }

    const updated = await prisma.ocorrencia.update({
      where: { id },
      data: { status: normalizeStatus(status) },
      include: {
        colaborador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar status da ocorrencia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, getById, create, updateStatus };

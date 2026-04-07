const { PrismaClient } = require('@prisma/client');
const { isAdminLevel } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

function getActorColaboradorId(user) {
  return user.colaboradorId || user.moradorId || null;
}

function normalizePriority(priority) {
  const value = String(priority || '').toUpperCase();
  if (value === 'ALTA' || value === 'MEDIA' || value === 'BAIXA') return value;
  return 'MEDIA';
}

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase();
  if (['EM_ANALISE', 'EM_ANDAMENTO', 'RESOLVIDA'].includes(value)) return value;
  return 'EM_ANALISE';
}

function isMoradorUser(user) {
  return !isAdminLevel(user) && !!user.moradorId;
}

function canManageOcorrencia(user, ocorrencia) {
  if (isAdminLevel(user)) {
    return true;
  }

  const actorId = getActorColaboradorId(user);
  if (!actorId) {
    return false;
  }

  if (!ocorrencia.colaboradorId) {
    return true;
  }

  return ocorrencia.colaboradorId === actorId;
}

async function list(req, res) {
  try {
    const { status, prioridade } = req.query;
    const where = {};
    if (status) where.status = normalizeStatus(status);
    if (prioridade) where.prioridade = normalizePriority(prioridade);

    if (isMoradorUser(req.user)) {
      where.moradorId = req.user.moradorId;
      const ocorrencias = await prisma.ocorrenciaMorador.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return res.json(ocorrencias);
    }

    const ocorrencias = await prisma.ocorrencia.findMany({
      where,
      include: {
        colaborador: { select: { id: true, nome: true, bloco: true, unidade: true } },
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

    if (isMoradorUser(req.user)) {
      const ocorrencia = await prisma.ocorrenciaMorador.findUnique({ where: { id } });
      if (!ocorrencia) {
        return res.status(404).json({ error: 'Ocorrencia nao encontrada' });
      }
      if (ocorrencia.moradorId !== req.user.moradorId) {
        return res.status(403).json({ error: 'Sem permissao para acessar esta ocorrencia' });
      }
      return res.json(ocorrencia);
    }

    const ocorrencia = await prisma.ocorrencia.findUnique({
      where: { id },
      include: {
        colaborador: { select: { id: true, nome: true, bloco: true, unidade: true } },
      },
    });

    if (!ocorrencia) {
      return res.status(404).json({ error: 'Ocorrencia nao encontrada' });
    }

    res.json(ocorrencia);
  } catch (error) {
    console.error('Erro ao buscar ocorrencia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const { tipo, local, descricao, prioridade, status, colaboradorId } = req.body;

    if (isMoradorUser(req.user)) {
      const ocorrencia = await prisma.ocorrenciaMorador.create({
        data: {
          moradorId: req.user.moradorId,
          tipo,
          local,
          descricao,
          prioridade: normalizePriority(prioridade),
          status: normalizeStatus(status),
        },
      });
      return res.status(201).json(ocorrencia);
    }

    let targetColaboradorId = null;
    if (isAdminLevel(req.user)) {
      if (colaboradorId != null) targetColaboradorId = Number(colaboradorId);
    } else {
      const actorId = req.user.colaboradorId;
      if (!actorId) return res.status(403).json({ error: 'Usuario colaborador invalido' });
      targetColaboradorId = actorId;
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
        colaborador: { select: { id: true, nome: true, bloco: true, unidade: true } },
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
    const normalizedStatus = normalizeStatus(status);

    let ocorrencia = await prisma.ocorrencia.findUnique({ where: { id } });
    if (ocorrencia) {
      if (!canManageOcorrencia(req.user, ocorrencia)) {
        return res.status(403).json({ error: 'Sem permissao para atualizar esta ocorrencia' });
      }

      const updated = await prisma.ocorrencia.update({
        where: { id },
        data: { status: normalizedStatus },
        include: {
          colaborador: { select: { id: true, nome: true, bloco: true, unidade: true } },
        },
      });
      return res.json(updated);
    }

    ocorrencia = await prisma.ocorrenciaMorador.findUnique({ where: { id } });
    if (ocorrencia) {
      if (ocorrencia.moradorId !== req.user.moradorId && !isAdminLevel(req.user)) {
        return res.status(403).json({ error: 'Sem permissao para atualizar esta ocorrencia' });
      }
      const updated = await prisma.ocorrenciaMorador.update({
        where: { id },
        data: { status: normalizedStatus },
      });
      return res.json(updated);
    }

    return res.status(404).json({ error: 'Ocorrencia nao encontrada' });
  } catch (error) {
    console.error('Erro ao atualizar status da ocorrencia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const ocorrencia = await prisma.ocorrencia.findUnique({ where: { id } });
    if (!ocorrencia) {
      return res.status(404).json({ error: 'Ocorrencia nao encontrada' });
    }

    if (!canManageOcorrencia(req.user, ocorrencia)) {
      return res.status(403).json({ error: 'Sem permissao para editar esta ocorrencia' });
    }

    const { tipo, local, descricao, prioridade, status } = req.body;
    const updated = await prisma.ocorrencia.update({
      where: { id },
      data: {
        tipo,
        local,
        descricao,
        prioridade: normalizePriority(prioridade),
        status: normalizeStatus(status || ocorrencia.status),
      },
      include: {
        colaborador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar ocorrencia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    const ocorrencia = await prisma.ocorrencia.findUnique({ where: { id } });
    if (!ocorrencia) {
      return res.status(404).json({ error: 'Ocorrencia nao encontrada' });
    }

    if (!canManageOcorrencia(req.user, ocorrencia)) {
      return res.status(403).json({ error: 'Sem permissao para excluir esta ocorrencia' });
    }

    await prisma.ocorrencia.delete({ where: { id } });
    res.json({ message: 'Ocorrencia removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover ocorrencia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, getById, create, updateStatus, update, remove };

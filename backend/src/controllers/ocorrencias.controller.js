const { PrismaClient } = require('@prisma/client');
const { isAdminLevel } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

function normalizePriority(priority) {
  const value = String(priority || '').toUpperCase();
  if (value === 'ALTA' || value === 'MEDIA' || value === 'BAIXA') return value;
  return 'MEDIA';
}

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase();
  if (['ABERTA', 'EM_ANALISE', 'EM_ANDAMENTO', 'RESOLVIDA'].includes(value)) return value;
  return 'ABERTA';
}

function isMoradorUser(user) {
  return !isAdminLevel(user) && !!user.moradorId;
}

async function list(req, res) {
  try {
    const { status, prioridade } = req.query;
    const where = {};
    if (status) where.status = normalizeStatus(status);
    if (prioridade) where.prioridade = normalizePriority(prioridade);

    // Morador → tabela ocorrencias_morador
    if (isMoradorUser(req.user)) {
      where.moradorId = req.user.moradorId;
      const ocorrencias = await prisma.ocorrenciaMorador.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return res.json(ocorrencias);
    }

    // Colaborador (não-admin) → filtra pela própria conta
    if (!isAdminLevel(req.user)) {
      const colaboradorId = req.user.colaboradorId;
      if (!colaboradorId) {
        return res.status(403).json({ error: 'Usuario colaborador invalido' });
      }
      where.colaboradorId = colaboradorId;
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

    // Morador → tabela ocorrencias_morador
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

    if (!isAdminLevel(req.user) && ocorrencia.colaboradorId !== req.user.colaboradorId) {
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
    const { tipo, local, descricao, prioridade, status, colaboradorId } = req.body;

    // Morador → tabela ocorrencias_morador
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

    // Colaborador / Admin
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

    // Tenta em ocorrencias primeiro, depois em ocorrencias_morador
    let ocorrencia = await prisma.ocorrencia.findUnique({ where: { id } });
    if (ocorrencia) {
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

module.exports = { list, getById, create, updateStatus };

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

    if (req.user.role !== 'ADMIN') {
      if (!req.user.moradorId) {
        return res.status(403).json({ error: 'Usuário morador inválido' });
      }
      where.moradorId = req.user.moradorId;
    }

    const ocorrencias = await prisma.ocorrencia.findMany({
      where,
      include: {
        morador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(ocorrencias);
  } catch (error) {
    console.error('Erro ao listar ocorrências:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id);

    const ocorrencia = await prisma.ocorrencia.findUnique({
      where: { id },
      include: {
        morador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
    });

    if (!ocorrencia) {
      return res.status(404).json({ error: 'Ocorrência não encontrada' });
    }

    if (req.user.role !== 'ADMIN' && ocorrencia.moradorId !== req.user.moradorId) {
      return res.status(403).json({ error: 'Sem permissão para acessar esta ocorrência' });
    }

    res.json(ocorrencia);
  } catch (error) {
    console.error('Erro ao buscar ocorrência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const { tipo, local, descricao, prioridade, status, moradorId } = req.body;

    let targetMoradorId = null;
    if (req.user.role === 'ADMIN') {
      if (moradorId != null) {
        targetMoradorId = Number(moradorId);
      }
    } else {
      if (!req.user.moradorId) {
        return res.status(403).json({ error: 'Usuário morador inválido' });
      }
      targetMoradorId = req.user.moradorId;
    }

    if (targetMoradorId) {
      const moradorExists = await prisma.morador.findUnique({ where: { id: targetMoradorId } });
      if (!moradorExists) {
        return res.status(404).json({ error: 'Morador informado não encontrado' });
      }
    }

    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        moradorId: targetMoradorId,
        tipo,
        local,
        descricao,
        prioridade: normalizePriority(prioridade),
        status: normalizeStatus(status),
      },
      include: {
        morador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
    });

    res.status(201).json(ocorrencia);
  } catch (error) {
    console.error('Erro ao criar ocorrência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function updateStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const ocorrencia = await prisma.ocorrencia.findUnique({ where: { id } });
    if (!ocorrencia) {
      return res.status(404).json({ error: 'Ocorrência não encontrada' });
    }

    const updated = await prisma.ocorrencia.update({
      where: { id },
      data: { status: normalizeStatus(status) },
      include: {
        morador: {
          select: { id: true, nome: true, bloco: true, unidade: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar status da ocorrência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, getById, create, updateStatus };

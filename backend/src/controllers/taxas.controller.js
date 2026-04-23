const { PrismaClient } = require('@prisma/client');
const { isAdminLevel } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

const STATUS_VALIDOS = ['PAGA', 'PENDENTE', 'ATRASADA'];

function serializeTaxa(taxa) {
  if (!taxa) return taxa;

  return {
    ...taxa,
    pixEncodedImage: taxa.pixQrCodeImage ?? null,
    pixExpirationDate: taxa.pixExpirationDate ?? null,
  };
}

function normalizeStatus(v) {
  const val = String(v || '').toUpperCase();
  return STATUS_VALIDOS.includes(val) ? val : 'PENDENTE';
}

async function list(req, res) {
  try {
    const { status, ano } = req.query;
    const where = {};

    if (!isAdminLevel(req.user)) {
      const moradorId = req.user.moradorId;
      if (!moradorId) {
        return res.status(403).json({ error: 'Acesso restrito a moradores' });
      }
      where.moradorId = moradorId;
    } else if (req.query.moradorId) {
      where.moradorId = Number(req.query.moradorId);
    }

    if (status) where.status = normalizeStatus(status);
    if (ano) where.ano = Number(ano);

    const taxas = await prisma.taxa.findMany({
      where,
      include: {
        morador: { select: { id: true, nome: true, bloco: true, unidade: true } },
      },
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    });

    res.json(taxas.map(serializeTaxa));
  } catch (error) {
    console.error('Erro ao listar taxas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id);

    const taxa = await prisma.taxa.findUnique({
      where: { id },
      include: {
        morador: { select: { id: true, nome: true, bloco: true, unidade: true } },
      },
    });

    if (!taxa) {
      return res.status(404).json({ error: 'Taxa nao encontrada' });
    }

    if (!isAdminLevel(req.user) && taxa.moradorId !== req.user.moradorId) {
      return res.status(403).json({ error: 'Sem permissao para acessar esta taxa' });
    }

    res.json(serializeTaxa(taxa));
  } catch (error) {
    console.error('Erro ao buscar taxa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const { moradorId, descricao, mes, ano, valor, vencimento, status } = req.body;

    const morador = await prisma.morador.findUnique({ where: { id: Number(moradorId) } });
    if (!morador) {
      return res.status(404).json({ error: 'Morador nao encontrado' });
    }

    const taxa = await prisma.taxa.create({
      data: {
        moradorId: Number(moradorId),
        descricao: descricao || 'Taxa de Condominio',
        mes: Number(mes),
        ano: Number(ano),
        valor: Number(valor),
        vencimento: new Date(vencimento),
        status: normalizeStatus(status),
      },
      include: {
        morador: { select: { id: true, nome: true, bloco: true, unidade: true } },
      },
    });

    res.status(201).json(serializeTaxa(taxa));
  } catch (error) {
    console.error('Erro ao criar taxa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function marcarPago(req, res) {
  try {
    const id = Number(req.params.id);
    const { pagoEm } = req.body;

    const taxa = await prisma.taxa.findUnique({ where: { id } });
    if (!taxa) {
      return res.status(404).json({ error: 'Taxa nao encontrada' });
    }

    const updated = await prisma.taxa.update({
      where: { id },
      data: {
        status: 'PAGA',
        pagoEm: pagoEm ? new Date(pagoEm) : new Date(),
      },
      include: {
        morador: { select: { id: true, nome: true, bloco: true, unidade: true } },
      },
    });

    res.json(serializeTaxa(updated));
  } catch (error) {
    console.error('Erro ao marcar taxa como paga:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function updateStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const taxa = await prisma.taxa.findUnique({ where: { id } });
    if (!taxa) {
      return res.status(404).json({ error: 'Taxa nao encontrada' });
    }

    const updated = await prisma.taxa.update({
      where: { id },
      data: { status: normalizeStatus(status) },
    });

    res.json(serializeTaxa(updated));
  } catch (error) {
    console.error('Erro ao atualizar status da taxa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, getById, create, marcarPago, updateStatus };

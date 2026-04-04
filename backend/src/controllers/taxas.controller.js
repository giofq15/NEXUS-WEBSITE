const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function list(req, res) {
  try {
    const moradorId = req.user.moradorId;
    if (!moradorId) return res.status(403).json({ error: 'Acesso restrito a moradores' });

    const taxas = await prisma.taxa.findMany({
      where: { moradorId },
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    });

    res.json(taxas);
  } catch (error) {
    console.error('Erro ao listar taxas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function listAll(req, res) {
  try {
    const { moradorId, status } = req.query;
    const where = {};
    if (moradorId) where.moradorId = parseInt(moradorId);
    if (status) where.status = status;

    const taxas = await prisma.taxa.findMany({
      where,
      include: { morador: { select: { nome: true, bloco: true, unidade: true } } },
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    });

    res.json(taxas);
  } catch (error) {
    console.error('Erro ao listar todas as taxas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const { moradorId, mes, ano, valor, vencimento } = req.body;

    const taxa = await prisma.taxa.create({
      data: {
        moradorId: parseInt(moradorId),
        mes: parseInt(mes),
        ano: parseInt(ano),
        valor: parseFloat(valor),
        vencimento: new Date(vencimento),
      },
    });

    res.status(201).json(taxa);
  } catch (error) {
    console.error('Erro ao criar taxa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function updateStatus(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['PAGA', 'PENDENTE', 'ATRASADA'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status invalido' });
    }

    const data = { status };
    if (status === 'PAGA') data.paidAt = new Date();

    const taxa = await prisma.taxa.update({ where: { id }, data });
    res.json(taxa);
  } catch (error) {
    console.error('Erro ao atualizar status da taxa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, listAll, create, updateStatus };

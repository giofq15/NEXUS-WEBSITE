const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SINGLETON_ID = 1;

async function getConfig(req, res) {
  try {
    let config = await prisma.condominio.findUnique({ where: { id: SINGLETON_ID } });
    if (!config) {
      config = await prisma.condominio.create({ data: { id: SINGLETON_ID, nome: 'NEXUS' } });
    }
    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configuracoes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function updateConfig(req, res) {
  try {
    const { nome, razaoSocial, cnpj, endereco, telefonePredio, quantidadeColaboradores, sindico } = req.body;

    const config = await prisma.condominio.upsert({
      where: { id: SINGLETON_ID },
      update: {
        nome: nome || 'NEXUS',
        razaoSocial: razaoSocial || null,
        cnpj: cnpj || null,
        endereco: endereco || null,
        telefonePredio: telefonePredio || null,
        quantidadeColaboradores: quantidadeColaboradores ? Number(quantidadeColaboradores) : null,
        sindico: sindico || null,
      },
      create: {
        id: SINGLETON_ID,
        nome: nome || 'NEXUS',
        razaoSocial: razaoSocial || null,
        cnpj: cnpj || null,
        endereco: endereco || null,
        telefonePredio: telefonePredio || null,
        quantidadeColaboradores: quantidadeColaboradores ? Number(quantidadeColaboradores) : null,
        sindico: sindico || null,
      },
    });

    res.json(config);
  } catch (error) {
    console.error('Erro ao atualizar configuracoes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { getConfig, updateConfig };

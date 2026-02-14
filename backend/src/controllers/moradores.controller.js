const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// GET /api/moradores?search=termo
async function list(req, res) {
  try {
    const { search } = req.query;

    const where = search
      ? {
          OR: [
            { nome: { contains: search, mode: 'insensitive' } },
            { unidade: { contains: search, mode: 'insensitive' } },
            { bloco: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const moradores = await prisma.morador.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { nome: 'asc' },
    });

    res.json(moradores);
  } catch (error) {
    console.error('Erro ao listar moradores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// GET /api/moradores/:id
async function getById(req, res) {
  try {
    const { id } = req.params;

    const morador = await prisma.morador.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { email: true } },
        veiculos: true,
      },
    });

    if (!morador) {
      return res.status(404).json({ error: 'Morador não encontrado' });
    }

    res.json(morador);
  } catch (error) {
    console.error('Erro ao buscar morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// POST /api/moradores
async function create(req, res) {
  try {
    const { nome, cpf, nascimento, telefone, bloco, unidade, tipoMoradia, status, email } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const existingCpf = await prisma.morador.findUnique({ where: { cpf } });
    if (existingCpf) {
      return res.status(409).json({ error: 'CPF já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash('morador123', 10);

    const morador = await prisma.morador.create({
      data: {
        nome,
        cpf,
        nascimento: nascimento ? new Date(nascimento) : null,
        telefone,
        bloco,
        unidade,
        tipoMoradia: tipoMoradia || 'PROPRIETARIO',
        status: status || 'PENDENTE',
        user: {
          create: {
            email,
            password: hashedPassword,
            role: 'MORADOR',
          },
        },
      },
      include: { user: { select: { email: true } } },
    });

    res.status(201).json(morador);
  } catch (error) {
    console.error('Erro ao criar morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// PUT /api/moradores/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const { nome, cpf, nascimento, telefone, bloco, unidade, tipoMoradia, status, email } = req.body;

    const morador = await prisma.morador.findUnique({
      where: { id: Number(id) },
      include: { user: true },
    });

    if (!morador) {
      return res.status(404).json({ error: 'Morador não encontrado' });
    }

    const updated = await prisma.morador.update({
      where: { id: Number(id) },
      data: {
        nome,
        cpf,
        nascimento: nascimento ? new Date(nascimento) : null,
        telefone,
        bloco,
        unidade,
        tipoMoradia,
        status,
        user: email ? { update: { email } } : undefined,
      },
      include: { user: { select: { email: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// DELETE /api/moradores/:id
async function remove(req, res) {
  try {
    const { id } = req.params;

    const morador = await prisma.morador.findUnique({
      where: { id: Number(id) },
    });

    if (!morador) {
      return res.status(404).json({ error: 'Morador não encontrado' });
    }

    // Cascade delete: removing the user also removes the morador (onDelete: Cascade)
    await prisma.user.delete({ where: { id: morador.userId } });

    res.json({ message: 'Morador removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover morador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// POST /api/moradores/:id/veiculos
async function addVeiculo(req, res) {
  try {
    const { id } = req.params;
    const { placa, tipo } = req.body;

    const morador = await prisma.morador.findUnique({ where: { id: Number(id) } });
    if (!morador) {
      return res.status(404).json({ error: 'Morador não encontrado' });
    }

    const existingPlaca = await prisma.veiculo.findUnique({ where: { placa } });
    if (existingPlaca) {
      return res.status(409).json({ error: 'Placa já cadastrada' });
    }

    const veiculo = await prisma.veiculo.create({
      data: { moradorId: Number(id), placa, tipo },
    });

    res.status(201).json(veiculo);
  } catch (error) {
    console.error('Erro ao adicionar veículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// DELETE /api/moradores/:id/veiculos/:veiculoId
async function removeVeiculo(req, res) {
  try {
    const { id, veiculoId } = req.params;

    const veiculo = await prisma.veiculo.findFirst({
      where: { id: Number(veiculoId), moradorId: Number(id) },
    });

    if (!veiculo) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    await prisma.veiculo.delete({ where: { id: Number(veiculoId) } });

    res.json({ message: 'Veículo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover veículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, getById, create, update, remove, addVeiculo, removeVeiculo };

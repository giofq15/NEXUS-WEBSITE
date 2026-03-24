const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// GET /api/colaboradores?search=termo
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

    const colaboradores = await prisma.colaborador.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { nome: 'asc' },
    });

    res.json(colaboradores);
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// GET /api/colaboradores/:id
async function getById(req, res) {
  try {
    const { id } = req.params;

    const colaborador = await prisma.colaborador.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { email: true } },
        veiculos: true,
      },
    });

    if (!colaborador) {
      return res.status(404).json({ error: 'Colaborador nao encontrado' });
    }

    res.json(colaborador);
  } catch (error) {
    console.error('Erro ao buscar colaborador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// POST /api/colaboradores
async function create(req, res) {
  try {
    const { nome, cpf, nascimento, telefone, bloco, unidade, status, email } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'E-mail ja cadastrado' });
    }

    const existingCpf = await prisma.colaborador.findUnique({ where: { cpf } });
    if (existingCpf) {
      return res.status(409).json({ error: 'CPF ja cadastrado' });
    }

    const hashedPassword = await bcrypt.hash('colaborador123', 10);

    const colaborador = await prisma.colaborador.create({
      data: {
        nome,
        cpf,
        nascimento: nascimento ? new Date(nascimento) : null,
        telefone,
        bloco,
        unidade,
        status: status || 'PENDENTE',
        user: {
          create: {
            email,
            password: hashedPassword,
            role: 'COLABORADOR',
            accessLevel: 'COLABORADOR',
          },
        },
      },
      include: { user: { select: { email: true } } },
    });

    res.status(201).json(colaborador);
  } catch (error) {
    console.error('Erro ao criar colaborador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// PUT /api/colaboradores/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const { nome, cpf, nascimento, telefone, bloco, unidade, status, email } = req.body;

    const colaborador = await prisma.colaborador.findUnique({
      where: { id: Number(id) },
      include: { user: true },
    });

    if (!colaborador) {
      return res.status(404).json({ error: 'Colaborador nao encontrado' });
    }

    const updated = await prisma.colaborador.update({
      where: { id: Number(id) },
      data: {
        nome,
        cpf,
        nascimento: nascimento ? new Date(nascimento) : null,
        telefone,
        bloco,
        unidade,
        status,
        user: email ? { update: { email } } : undefined,
      },
      include: { user: { select: { email: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar colaborador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// DELETE /api/colaboradores/:id
async function remove(req, res) {
  try {
    const { id } = req.params;

    const colaborador = await prisma.colaborador.findUnique({
      where: { id: Number(id) },
    });

    if (!colaborador) {
      return res.status(404).json({ error: 'Colaborador nao encontrado' });
    }

    await prisma.user.delete({ where: { id: colaborador.userId } });

    res.json({ message: 'Colaborador removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover colaborador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// POST /api/colaboradores/:id/veiculos
async function addVeiculo(req, res) {
  try {
    const { id } = req.params;
    const { placa, tipo } = req.body;

    const colaborador = await prisma.colaborador.findUnique({ where: { id: Number(id) } });
    if (!colaborador) {
      return res.status(404).json({ error: 'Colaborador nao encontrado' });
    }

    const existingPlaca = await prisma.veiculo.findUnique({ where: { placa } });
    if (existingPlaca) {
      return res.status(409).json({ error: 'Placa ja cadastrada' });
    }

    const veiculo = await prisma.veiculo.create({
      data: { colaboradorId: Number(id), placa, tipo },
    });

    res.status(201).json(veiculo);
  } catch (error) {
    console.error('Erro ao adicionar veiculo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// DELETE /api/colaboradores/:id/veiculos/:veiculoId
async function removeVeiculo(req, res) {
  try {
    const { id, veiculoId } = req.params;

    const veiculo = await prisma.veiculo.findFirst({
      where: { id: Number(veiculoId), colaboradorId: Number(id) },
    });

    if (!veiculo) {
      return res.status(404).json({ error: 'Veiculo nao encontrado' });
    }

    await prisma.veiculo.delete({ where: { id: Number(veiculoId) } });

    res.json({ message: 'Veiculo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover veiculo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, getById, create, update, remove, addVeiculo, removeVeiculo };

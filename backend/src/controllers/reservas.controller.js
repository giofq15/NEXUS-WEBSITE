const { PrismaClient } = require('@prisma/client');
const { isAdminLevel } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

const PERIODOS_VALIDOS = ['MANHA', 'TARDE', 'DIA_INTEIRO'];
const STATUS_VALIDOS = ['PENDENTE', 'CONFIRMADA', 'CANCELADA'];

function normalizePeriodo(v) {
  const val = String(v || '').toUpperCase();
  return PERIODOS_VALIDOS.includes(val) ? val : null;
}

function normalizeStatus(v) {
  const val = String(v || '').toUpperCase();
  return STATUS_VALIDOS.includes(val) ? val : 'PENDENTE';
}

async function list(req, res) {
  try {
    const { status, areaId, data } = req.query;
    const where = {};

    if (!isAdminLevel(req.user)) {
      const moradorId = req.user.moradorId;
      if (!moradorId) {
        return res.status(403).json({ error: 'Acesso restrito a moradores' });
      }
      where.moradorId = moradorId;
    }

    if (status) where.status = normalizeStatus(status);
    if (areaId) where.areaLazerId = Number(areaId);
    if (data) where.data = new Date(data);

    const reservas = await prisma.reserva.findMany({
      where,
      include: {
        areaLazer: { select: { id: true, nome: true, capacidade: true } },
        morador: { select: { id: true, nome: true, bloco: true, unidade: true } },
      },
      orderBy: [{ data: 'asc' }, { periodo: 'asc' }],
    });

    res.json(reservas);
  } catch (error) {
    console.error('Erro ao listar reservas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id);

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        areaLazer: true,
        morador: { select: { id: true, nome: true, bloco: true, unidade: true } },
      },
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva nao encontrada' });
    }

    if (!isAdminLevel(req.user) && reserva.moradorId !== req.user.moradorId) {
      return res.status(403).json({ error: 'Sem permissao para acessar esta reserva' });
    }

    res.json(reserva);
  } catch (error) {
    console.error('Erro ao buscar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function disponibilidade(req, res) {
  try {
    const { areaId, data } = req.query;

    if (!areaId || !data) {
      return res.status(400).json({ error: 'areaId e data sao obrigatorios' });
    }

    const area = await prisma.areaLazer.findUnique({ where: { id: Number(areaId) } });
    if (!area) {
      return res.status(404).json({ error: 'Area de lazer nao encontrada' });
    }

    const reservasNoDia = await prisma.reserva.findMany({
      where: {
        areaLazerId: Number(areaId),
        data: new Date(data),
        status: { not: 'CANCELADA' },
      },
      select: { periodo: true },
    });

    const periodosOcupados = reservasNoDia.map((r) => r.periodo);

    const allPeriodos = ['MANHA', 'TARDE', 'DIA_INTEIRO'];
    const periodosDisponiveis = allPeriodos.filter((p) => {
      if (periodosOcupados.includes('DIA_INTEIRO')) return false;
      if (p === 'DIA_INTEIRO' && periodosOcupados.length > 0) return false;
      return !periodosOcupados.includes(p);
    });

    res.json({
      area: { id: area.id, nome: area.nome, capacidade: area.capacidade },
      data,
      periodosDisponiveis,
      periodosOcupados,
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const { areaLazerId, data, periodo, convidados } = req.body;

    let moradorId = req.user.moradorId;

    if (isAdminLevel(req.user) && req.body.moradorId) {
      moradorId = Number(req.body.moradorId);
    }

    if (!moradorId) {
      return res.status(403).json({ error: 'Apenas moradores podem fazer reservas' });
    }

    const periodoNorm = normalizePeriodo(periodo);
    if (!periodoNorm) {
      return res.status(400).json({ error: 'Periodo invalido. Use: MANHA, TARDE ou DIA_INTEIRO' });
    }

    const area = await prisma.areaLazer.findUnique({ where: { id: Number(areaLazerId) } });
    if (!area || !area.ativo) {
      return res.status(404).json({ error: 'Area de lazer nao disponivel' });
    }

    const dataReserva = new Date(data);

    // Verificar conflito de horário
    const conflito = await prisma.reserva.findFirst({
      where: {
        areaLazerId: Number(areaLazerId),
        data: dataReserva,
        status: { not: 'CANCELADA' },
        OR: [
          { periodo: periodoNorm },
          { periodo: 'DIA_INTEIRO' },
          ...(periodoNorm === 'DIA_INTEIRO'
            ? [{ periodo: 'MANHA' }, { periodo: 'TARDE' }]
            : []),
        ],
      },
    });

    if (conflito) {
      return res.status(409).json({ error: 'Horario ja reservado para esta area nesta data' });
    }

    const reserva = await prisma.reserva.create({
      data: {
        moradorId,
        areaLazerId: Number(areaLazerId),
        data: dataReserva,
        periodo: periodoNorm,
        convidados: convidados ? Number(convidados) : 0,
        status: 'PENDENTE',
      },
      include: {
        areaLazer: { select: { id: true, nome: true } },
        morador: { select: { id: true, nome: true, bloco: true, unidade: true } },
      },
    });

    res.status(201).json(reserva);
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function cancelar(req, res) {
  try {
    const id = Number(req.params.id);

    const reserva = await prisma.reserva.findUnique({ where: { id } });
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva nao encontrada' });
    }

    if (!isAdminLevel(req.user) && reserva.moradorId !== req.user.moradorId) {
      return res.status(403).json({ error: 'Sem permissao para cancelar esta reserva' });
    }

    if (reserva.status === 'CANCELADA') {
      return res.status(400).json({ error: 'Reserva ja esta cancelada' });
    }

    const updated = await prisma.reserva.update({
      where: { id },
      data: { status: 'CANCELADA' },
      include: { areaLazer: { select: { id: true, nome: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function updateStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const reserva = await prisma.reserva.findUnique({ where: { id } });
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva nao encontrada' });
    }

    const updated = await prisma.reserva.update({
      where: { id },
      data: { status: normalizeStatus(status) },
      include: {
        areaLazer: { select: { id: true, nome: true } },
        morador: { select: { id: true, nome: true, bloco: true, unidade: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar status da reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { list, getById, disponibilidade, create, cancelar, updateStatus };

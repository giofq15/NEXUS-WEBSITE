const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function list(req, res) {
  try {
    const moradorId = req.user.moradorId;
    if (!moradorId) return res.status(403).json({ error: 'Acesso restrito a moradores' });

    const reservas = await prisma.reserva.findMany({
      where: { moradorId },
      include: { area: true },
      orderBy: { data: 'desc' },
    });

    res.json(reservas);
  } catch (error) {
    console.error('Erro ao listar reservas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function disponibilidade(req, res) {
  try {
    const { areaId, data } = req.query;
    if (!areaId || !data) {
      return res.status(400).json({ error: 'areaId e data sao obrigatorios' });
    }

    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);

    const reservas = await prisma.reserva.findMany({
      where: {
        areaId: parseInt(areaId),
        data: { gte: dataInicio, lte: dataFim },
        status: { not: 'CANCELADA' },
      },
      select: { periodo: true, status: true },
    });

    const periodosOcupados = reservas.map((r) => r.periodo);
    const diaInteiro = periodosOcupados.includes('DIA_INTEIRO');

    res.json({
      MANHA: diaInteiro || periodosOcupados.includes('MANHA'),
      TARDE: diaInteiro || periodosOcupados.includes('TARDE'),
      DIA_INTEIRO: diaInteiro || (periodosOcupados.includes('MANHA') && periodosOcupados.includes('TARDE')),
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function create(req, res) {
  try {
    const moradorId = req.user.moradorId;
    if (!moradorId) return res.status(403).json({ error: 'Acesso restrito a moradores' });

    const { areaId, data, periodo, convidados } = req.body;

    const periodosValidos = ['MANHA', 'TARDE', 'DIA_INTEIRO'];
    if (!periodosValidos.includes(periodo)) {
      return res.status(400).json({ error: 'Periodo invalido' });
    }

    // Check availability
    const dataObj = new Date(data);
    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);

    const conflitos = await prisma.reserva.findMany({
      where: {
        areaId: parseInt(areaId),
        data: { gte: dataInicio, lte: dataFim },
        status: { not: 'CANCELADA' },
      },
      select: { periodo: true },
    });

    const periodosOcupados = conflitos.map((c) => c.periodo);
    const diaInteiroOcupado = periodosOcupados.includes('DIA_INTEIRO');

    if (
      diaInteiroOcupado ||
      periodosOcupados.includes(periodo) ||
      (periodo === 'DIA_INTEIRO' && (periodosOcupados.includes('MANHA') || periodosOcupados.includes('TARDE')))
    ) {
      return res.status(409).json({ error: 'Periodo indisponivel para esta data' });
    }

    const reserva = await prisma.reserva.create({
      data: {
        moradorId,
        areaId: parseInt(areaId),
        data: dataObj,
        periodo,
        convidados: parseInt(convidados) || 0,
        status: 'CONFIRMADA',
      },
      include: { area: true },
    });

    // Notify admins via SSE
    if (req.app.locals.broadcast) {
      const morador = await prisma.morador.findUnique({ where: { id: moradorId }, select: { nome: true } });
      req.app.locals.broadcast({
        tipo: 'nova_reserva',
        mensagem: `Nova reserva: ${morador?.nome} reservou ${reserva.area.nome}`,
        reservaId: reserva.id,
      });
    }

    res.status(201).json(reserva);
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function cancelar(req, res) {
  try {
    const moradorId = req.user.moradorId;
    const id = parseInt(req.params.id);

    const reserva = await prisma.reserva.findUnique({ where: { id } });
    if (!reserva) return res.status(404).json({ error: 'Reserva nao encontrada' });

    if (!isAdmin(req.user) && reserva.moradorId !== moradorId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (reserva.status === 'CANCELADA') {
      return res.status(400).json({ error: 'Reserva ja cancelada' });
    }

    const updated = await prisma.reserva.update({
      where: { id },
      data: { status: 'CANCELADA' },
      include: { area: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

function isAdmin(user) {
  return user.accessLevel === 'ADMIN' || user.accessLevel === 'ROOT' || user.role === 'ADMIN';
}

module.exports = { list, disponibilidade, create, cancelar };

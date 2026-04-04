const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedColaborador = await bcrypt.hash('colaborador123', 10);
  const hashedMorador = await bcrypt.hash('morador123', 10);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@nexus.com' },
    update: {},
    create: {
      email: 'admin@nexus.com',
      password: hashedAdmin,
      role: 'ADMIN',
      accessLevel: 'ROOT',
    },
  });

  // Colaboradores
  const colaboradores = [
    { nome: 'Ana Silva', cpf: '111.111.111-11', telefone: '(11) 91111-1111', bloco: 'A', unidade: '101', status: 'ATIVO' },
    { nome: 'Carlos Pereira', cpf: '222.222.222-22', telefone: '(11) 92222-2222', bloco: 'B', unidade: '205', status: 'ATIVO' },
    { nome: 'Mariana Costa', cpf: '333.333.333-33', telefone: '(11) 93333-3333', bloco: 'A', unidade: '302', status: 'PENDENTE' },
    { nome: 'Joao Fernandes', cpf: '444.444.444-44', telefone: '(11) 94444-4444', bloco: 'A', unidade: '102', status: 'ATIVO' },
    { nome: 'Beatriz Mendes', cpf: '555.555.555-55', telefone: '(11) 95555-5555', bloco: 'C', unidade: '401', status: 'PENDENTE' },
    { nome: 'Felipe Castro', cpf: '666.666.666-66', telefone: '(11) 96666-6666', bloco: 'B', unidade: '201', status: 'ATIVO' },
    { nome: 'Gabriela Lima', cpf: '777.777.777-77', telefone: '(11) 97777-7777', bloco: 'C', unidade: '305', status: 'ATIVO' },
    { nome: 'Ricardo Alves', cpf: '888.888.888-88', telefone: '(11) 98888-8888', bloco: 'A', unidade: '501', status: 'PENDENTE' },
  ];

  for (const colaborador of colaboradores) {
    const emailBase = colaborador.nome.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const email = `${emailBase}@nexus.com`;

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedColaborador,
        role: 'COLABORADOR',
        accessLevel: 'COLABORADOR',
        colaborador: {
          create: {
            nome: colaborador.nome,
            cpf: colaborador.cpf,
            telefone: colaborador.telefone,
            bloco: colaborador.bloco,
            unidade: colaborador.unidade,
            status: colaborador.status,
          },
        },
      },
    });
  }

  const ana = await prisma.colaborador.findFirst({ where: { nome: 'Ana Silva' } });
  if (ana) {
    await prisma.veiculo.upsert({
      where: { placa: 'ABC-1234' },
      update: {},
      create: { colaboradorId: ana.id, placa: 'ABC-1234', tipo: 'CARRO' },
    });
    await prisma.veiculo.upsert({
      where: { placa: 'XYZ-9876' },
      update: {},
      create: { colaboradorId: ana.id, placa: 'XYZ-9876', tipo: 'MOTO' },
    });
  }

  // Morador de exemplo
  const lucasUser = await prisma.user.upsert({
    where: { email: 'lucas.oliveira@nexus.com' },
    update: {},
    create: {
      email: 'lucas.oliveira@nexus.com',
      password: hashedMorador,
      role: 'MORADOR',
      accessLevel: 'COLABORADOR',
      morador: {
        create: {
          nome: 'Lucas Oliveira',
          cpf: '999.999.999-99',
          telefone: '(11) 99999-9999',
          bloco: 'B',
          unidade: '302',
        },
      },
    },
    include: { morador: true },
  });

  const lucas = lucasUser.morador || await prisma.morador.findFirst({ where: { cpf: '999.999.999-99' } });

  // Áreas de lazer
  const areasData = [
    { nome: 'Salão de Festas', descricao: 'Salão climatizado com capacidade para 80 pessoas', capacidade: 80 },
    { nome: 'Academia', descricao: 'Equipamentos modernos de musculação e cardio', capacidade: 20 },
    { nome: 'Piscina', descricao: 'Piscina adulto e infantil', capacidade: 50 },
    { nome: 'Quadra Poliesportiva', descricao: 'Quadra coberta para futebol, vôlei e basquete', capacidade: 30 },
    { nome: 'Churrasqueira', descricao: 'Área gourmet com churrasqueira', capacidade: 40 },
  ];

  const areas = {};
  for (const area of areasData) {
    const existing = await prisma.areaLazer.findFirst({ where: { nome: area.nome } });
    if (!existing) {
      areas[area.nome] = await prisma.areaLazer.create({ data: area });
    } else {
      areas[area.nome] = existing;
    }
  }

  // Taxas de condomínio para Lucas (últimos 6 meses)
  if (lucas) {
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = d.getMonth() + 1;
      const ano = d.getFullYear();
      const vencimento = new Date(ano, mes - 1, 10); // vence todo dia 10

      const existing = await prisma.taxa.findFirst({ where: { moradorId: lucas.id, mes, ano } });
      if (!existing) {
        let status = 'PAGA';
        let paidAt = new Date(ano, mes - 1, 8); // pago dia 8

        if (i === 0) { // mês atual: pendente
          status = 'PENDENTE';
          paidAt = null;
        } else if (i === 1) { // mês passado: atrasado
          status = 'ATRASADA';
          paidAt = null;
        }

        await prisma.taxa.create({
          data: {
            moradorId: lucas.id,
            mes,
            ano,
            valor: 450.00,
            vencimento,
            status,
            ...(paidAt && { paidAt }),
          },
        });
      }
    }

    // Reserva de exemplo para Lucas
    const salao = areas['Salão de Festas'];
    if (salao) {
      const dataReserva = new Date();
      dataReserva.setDate(dataReserva.getDate() + 7); // daqui a 7 dias
      dataReserva.setHours(0, 0, 0, 0);

      const existing = await prisma.reserva.findFirst({
        where: { moradorId: lucas.id, areaId: salao.id, data: dataReserva },
      });
      if (!existing) {
        await prisma.reserva.create({
          data: {
            moradorId: lucas.id,
            areaId: salao.id,
            data: dataReserva,
            periodo: 'TARDE',
            convidados: 20,
            status: 'CONFIRMADA',
          },
        });
      }
    }
  }

  console.log('Seed concluido com sucesso!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

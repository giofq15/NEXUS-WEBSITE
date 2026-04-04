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

  // Colaboradores (funcionários)
  const colaboradoresData = [
    { nome: 'Ana Silva',       cpf: '111.111.111-11', telefone: '(11) 91111-1111', bloco: 'A', unidade: '101', status: 'ATIVO' },
    { nome: 'Carlos Pereira',  cpf: '222.222.222-22', telefone: '(11) 92222-2222', bloco: 'B', unidade: '205', status: 'ATIVO' },
    { nome: 'Mariana Costa',   cpf: '333.333.333-33', telefone: '(11) 93333-3333', bloco: 'A', unidade: '302', status: 'PENDENTE' },
    { nome: 'Joao Fernandes',  cpf: '444.444.444-44', telefone: '(11) 94444-4444', bloco: 'A', unidade: '102', status: 'ATIVO' },
    { nome: 'Beatriz Mendes',  cpf: '555.555.555-55', telefone: '(11) 95555-5555', bloco: 'C', unidade: '401', status: 'PENDENTE' },
    { nome: 'Felipe Castro',   cpf: '666.666.666-66', telefone: '(11) 96666-6666', bloco: 'B', unidade: '201', status: 'ATIVO' },
    { nome: 'Gabriela Lima',   cpf: '777.777.777-77', telefone: '(11) 97777-7777', bloco: 'C', unidade: '305', status: 'ATIVO' },
    { nome: 'Ricardo Alves',   cpf: '888.888.888-88', telefone: '(11) 98888-8888', bloco: 'A', unidade: '501', status: 'PENDENTE' },
  ];

  for (const colab of colaboradoresData) {
    const emailBase = colab.nome.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
            nome: colab.nome,
            cpf: colab.cpf,
            telefone: colab.telefone,
            bloco: colab.bloco,
            unidade: colab.unidade,
            status: colab.status,
          },
        },
      },
    });
  }

  // Veículos da Ana
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

  // Moradores (residentes)
  const moradoresData = [
    { nome: 'Lucas Oliveira',   cpf: '901.901.901-01', telefone: '(11) 99001-0001', bloco: 'B', unidade: '405', status: 'ATIVO',    email: 'lucas.oliveira@nexus.com' },
    { nome: 'Patricia Santos',  cpf: '902.902.902-02', telefone: '(11) 99002-0002', bloco: 'A', unidade: '201', status: 'ATIVO',    email: 'patricia.santos@nexus.com' },
    { nome: 'Roberto Nunes',    cpf: '903.903.903-03', telefone: '(11) 99003-0003', bloco: 'C', unidade: '103', status: 'ATIVO',    email: 'roberto.nunes@nexus.com' },
    { nome: 'Camila Rocha',     cpf: '904.904.904-04', telefone: '(11) 99004-0004', bloco: 'B', unidade: '302', status: 'PENDENTE', email: 'camila.rocha@nexus.com' },
  ];

  const moradoresCriados = [];

  for (const mor of moradoresData) {
    const existingUser = await prisma.user.findUnique({ where: { email: mor.email } });
    if (existingUser) {
      const morador = await prisma.morador.findUnique({ where: { userId: existingUser.id } });
      if (morador) moradoresCriados.push(morador);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: mor.email,
        password: hashedMorador,
        role: 'MORADOR',
        accessLevel: 'MORADOR',
        morador: {
          create: {
            nome: mor.nome,
            cpf: mor.cpf,
            telefone: mor.telefone,
            bloco: mor.bloco,
            unidade: mor.unidade,
            status: mor.status,
          },
        },
      },
      include: { morador: true },
    });
    moradoresCriados.push(user.morador);
  }

  // Áreas de lazer
  const areasData = [
    { nome: 'Salão de Festas', descricao: 'Salão principal com capacidade para 150 pessoas, cozinha equipada e sistema de som.', capacidade: 150 },
    { nome: 'Churrasqueira 1', descricao: 'Churrasqueira coberta com mesas e bancos para até 30 pessoas.', capacidade: 30 },
    { nome: 'Churrasqueira 2', descricao: 'Churrasqueira ao ar livre com espaço para até 25 pessoas.', capacidade: 25 },
    { nome: 'Espaço Gourmet',  descricao: 'Cozinha gourmet equipada com forno, fogão e bancadas para eventos íntimos.', capacidade: 20 },
    { nome: 'Sala de Reuniões', descricao: 'Sala com projetor e ar-condicionado para até 15 pessoas.', capacidade: 15 },
  ];

  const areasCriadas = [];
  for (const area of areasData) {
    const existing = await prisma.areaLazer.findFirst({ where: { nome: area.nome } });
    if (existing) {
      areasCriadas.push(existing);
    } else {
      const criada = await prisma.areaLazer.create({ data: area });
      areasCriadas.push(criada);
    }
  }

  // Taxas para os moradores (últimos 6 meses + mês atual)
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1; // 1-12

  for (const morador of moradoresCriados) {
    for (let i = 5; i >= -1; i--) {
      let mes = mesAtual - i;
      let ano = anoAtual;
      if (mes <= 0) { mes += 12; ano -= 1; }
      if (mes > 12) { mes -= 12; ano += 1; }

      const vencimento = new Date(ano, mes - 1, 25); // vence dia 25

      let status = 'PAGA';
      let pagoEm = null;

      if (i === -1) {
        // próximo mês — pendente
        status = 'PENDENTE';
      } else if (i === 0) {
        // mês atual
        if (hoje.getDate() > 25) {
          status = 'ATRASADA';
        } else {
          status = 'PENDENTE';
        }
      } else {
        // meses anteriores — 1 atrasado para demonstração
        if (i === 2 && morador.nome === 'Lucas Oliveira') {
          status = 'ATRASADA';
        } else {
          status = 'PAGA';
          pagoEm = new Date(ano, mes - 1, Math.floor(Math.random() * 10) + 1);
        }
      }

      const existing = await prisma.taxa.findFirst({
        where: { moradorId: morador.id, mes, ano },
      });

      if (!existing) {
        await prisma.taxa.create({
          data: {
            moradorId: morador.id,
            descricao: 'Taxa de Condominio',
            mes,
            ano,
            valor: 850.0,
            vencimento,
            status,
            pagoEm,
          },
        });
      }
    }
  }

  // Reservas de exemplo
  if (moradoresCriados.length > 0 && areasCriadas.length > 0) {
    const lucas = moradoresCriados.find((m) => m.nome === 'Lucas Oliveira');
    const patricia = moradoresCriados.find((m) => m.nome === 'Patricia Santos');
    const churrasqueira1 = areasCriadas.find((a) => a.nome === 'Churrasqueira 1');
    const salao = areasCriadas.find((a) => a.nome === 'Salão de Festas');

    const proximaSemana = new Date();
    proximaSemana.setDate(proximaSemana.getDate() + 7);

    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    proximoMes.setDate(15);

    if (lucas && churrasqueira1) {
      const existing = await prisma.reserva.findFirst({
        where: { moradorId: lucas.id, areaLazerId: churrasqueira1.id },
      });
      if (!existing) {
        await prisma.reserva.create({
          data: {
            moradorId: lucas.id,
            areaLazerId: churrasqueira1.id,
            data: proximaSemana,
            periodo: 'TARDE',
            convidados: 20,
            status: 'CONFIRMADA',
          },
        });
      }
    }

    if (patricia && salao) {
      const existing = await prisma.reserva.findFirst({
        where: { moradorId: patricia.id, areaLazerId: salao.id },
      });
      if (!existing) {
        await prisma.reserva.create({
          data: {
            moradorId: patricia.id,
            areaLazerId: salao.id,
            data: proximoMes,
            periodo: 'DIA_INTEIRO',
            convidados: 80,
            status: 'PENDENTE',
          },
        });
      }
    }
  }

  console.log('Seed concluido com sucesso!');
  console.log('');
  console.log('Credenciais de acesso:');
  console.log('  Admin:       admin@nexus.com       / admin123');
  console.log('  Colaborador: ana.silva@nexus.com   / colaborador123');
  console.log('  Morador:     lucas.oliveira@nexus.com / morador123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

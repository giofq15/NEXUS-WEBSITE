const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedMorador = await bcrypt.hash('morador123', 10);

  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@nexus.com' },
    update: {},
    create: {
      email: 'admin@nexus.com',
      password: hashedAdmin,
      role: 'ADMIN',
    },
  });

  // Moradores do frontend
  const moradores = [
    { nome: 'Ana Silva', cpf: '111.111.111-11', telefone: '(11) 91111-1111', bloco: 'A', unidade: '101', status: 'ATIVO' },
    { nome: 'Carlos Pereira', cpf: '222.222.222-22', telefone: '(11) 92222-2222', bloco: 'B', unidade: '205', status: 'ATIVO' },
    { nome: 'Mariana Costa', cpf: '333.333.333-33', telefone: '(11) 93333-3333', bloco: 'A', unidade: '302', status: 'PENDENTE' },
    { nome: 'João Fernandes', cpf: '444.444.444-44', telefone: '(11) 94444-4444', bloco: 'A', unidade: '102', status: 'ATIVO' },
    { nome: 'Beatriz Mendes', cpf: '555.555.555-55', telefone: '(11) 95555-5555', bloco: 'C', unidade: '401', status: 'PENDENTE' },
    { nome: 'Felipe Castro', cpf: '666.666.666-66', telefone: '(11) 96666-6666', bloco: 'B', unidade: '201', status: 'ATIVO' },
    { nome: 'Gabriela Lima', cpf: '777.777.777-77', telefone: '(11) 97777-7777', bloco: 'C', unidade: '305', status: 'ATIVO' },
    { nome: 'Ricardo Alves', cpf: '888.888.888-88', telefone: '(11) 98888-8888', bloco: 'A', unidade: '501', status: 'PENDENTE' },
  ];

  for (const m of moradores) {
    const emailBase = m.nome.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const email = `${emailBase}@nexus.com`;

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedMorador,
        role: 'MORADOR',
        morador: {
          create: {
            nome: m.nome,
            cpf: m.cpf,
            telefone: m.telefone,
            bloco: m.bloco,
            unidade: m.unidade,
            status: m.status,
          },
        },
      },
    });
  }

  // Veículos de exemplo (Ana Silva)
  const ana = await prisma.morador.findFirst({ where: { nome: 'Ana Silva' } });
  if (ana) {
    await prisma.veiculo.upsert({
      where: { placa: 'ABC-1234' },
      update: {},
      create: { moradorId: ana.id, placa: 'ABC-1234', tipo: 'CARRO' },
    });
    await prisma.veiculo.upsert({
      where: { placa: 'XYZ-9876' },
      update: {},
      create: { moradorId: ana.id, placa: 'XYZ-9876', tipo: 'MOTO' },
    });
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

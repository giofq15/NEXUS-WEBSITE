# NEXUS Website

Plataforma web full stack para gestão condominial, criada como projeto acadêmico de conclusão de curso.

O NEXUS centraliza rotinas administrativas e operacionais em um único sistema, com foco em organização interna, acompanhamento de demandas e melhor comunicação entre administração, colaboradores e moradores.

---

## ✨ Principais funcionalidades

- **Autenticação com JWT** e controle de acesso por perfil.
- **Painel administrativo** com visão geral operacional.
- **Gestão de colaboradores e moradores** (cadastro, edição e controle).
- **Módulo de ocorrências** com fluxo por perfis (admin, colaborador e morador).
- **Módulo financeiro** com telas de apoio e acompanhamento.
- **Reservas e áreas de lazer** com rotas e interfaces dedicadas.
- **Configurações do condomínio** em área administrativa.
- **Notificações e turnos** para suporte à operação.

---

## 🧱 Stack do projeto

### Backend

- Node.js
- Express
- Prisma ORM
- JWT (`jsonwebtoken`)
- `bcryptjs`
- `express-validator`
- `dotenv`
- CORS

### Banco de dados

- Prisma (migrations e seed)
- Banco relacional via `DATABASE_URL` (ex.: PostgreSQL em produção)

### Frontend

- HTML5
- CSS3
- JavaScript (Vanilla)
- Font Awesome

---

## 📁 Estrutura de diretórios

```text
NEXUS-WEBSITE/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── server.js
├── public/
│   ├── css/
│   ├── img/
│   └── js/
├── views/
│   ├── admin/
│   ├── colaborador/
│   ├── financeiro/
│   ├── ocorrencias/
│   └── public/
├── deploy/
├── package.json
└── README.md
```

---

## 🚀 Como rodar localmente

### 1) Pré-requisitos

- Node.js 18+
- npm 9+
- Banco de dados configurado (via `DATABASE_URL`)

### 2) Instalar dependências

Na raiz do projeto:

```bash
npm run install:backend
```

Ou, se preferir manualmente:

```bash
cd backend
npm install
```

### 3) Configurar variáveis de ambiente

Crie o arquivo `backend/.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nexus"
JWT_SECRET="sua_chave_super_secreta"
PORT=3000
HOST=0.0.0.0
```

### 4) Gerar client do Prisma

```bash
npm run prisma:generate
```

### 5) Aplicar migrations

```bash
npm run prisma:migrate
```

### 6) Popular o banco (seed)

```bash
npm run seed
```

### 7) Subir a aplicação

Modo desenvolvimento:

```bash
npm run dev
```

Modo produção/local simples:

```bash
npm run start
```

Servidor disponível em: `http://localhost:3000`

---

## 📜 Scripts disponíveis

### Scripts na raiz (`package.json`)

- `npm run dev` → executa `backend` em modo dev.
- `npm run start` → executa servidor backend.
- `npm run install:backend` → instala dependências em `backend`.
- `npm run prisma:generate` → gera Prisma Client.
- `npm run prisma:migrate` → aplica migrations.
- `npm run seed` → executa seed.

### Scripts em `backend/package.json`

- `npm run dev` → `nodemon src/server.js`
- `npm start` → `node src/server.js`
- `npm run prisma:generate` → `prisma generate`
- `npm run prisma:migrate` → `prisma migrate deploy`
- `npm run seed` → `node prisma/seed.js`
- `npm run start:prod` → gera Prisma, aplica migrations e inicia servidor

---

## 🔐 Perfis e acesso

Atualmente o sistema contempla os perfis:

- `ADMIN`
- `COLABORADOR`

As rotas protegidas utilizam autenticação por token JWT via middleware.

---

## ☁️ Deploy

Guias disponíveis na pasta `deploy/`:

- `deploy/render.md`
- `deploy/oracle-vm.md`

---

## 🧪 Status e evolução

O projeto já possui base funcional para autenticação, gestão de usuários operacionais, ocorrências e módulos administrativos.

Próximos passos recomendados:

- ampliar persistência de módulos hoje com comportamento parcial no frontend;
- fortalecer observabilidade e logs de produção;
- adicionar testes automatizados (API e integração);
- evoluir documentação de endpoints (ex.: OpenAPI/Swagger).

---

## 👥 Autoria

Projeto acadêmico desenvolvido para conclusão de curso.

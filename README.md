# NEXUS

Plataforma web para apoio a gestao condominial, desenvolvida como projeto de conclusao de curso.

O sistema foi pensado para centralizar rotinas administrativas de um condominio em uma unica interface, reunindo controle de colaboradores, ocorrencias, inadimplencia, reservas, infraestrutura e operacao financeira. A proposta do projeto e oferecer uma base digital para organizacao interna, acompanhamento de pendencias e melhoria da comunicacao entre administracao, equipe operacional e moradores.

## Finalidade do Projeto

O NEXUS foi desenvolvido com foco em cenarios de administracao condominial que exigem visao operacional e controle centralizado. Entre os principais objetivos do projeto estao:

- organizar o cadastro e a gestao de colaboradores
- acompanhar ocorrencias e demandas operacionais
- controlar unidades em atraso e apoiar rotinas de cobranca
- administrar reservas e disponibilidade de apartamentos
- concentrar informacoes institucionais do condominio
- oferecer uma interface moderna para apresentacao academica e demonstracao funcional

## Principais Modulos

- `Dashboard Administrativo`: visao geral das operacoes, indicadores e atalhos de gestao
- `Colaboradores`: cadastro, edicao, visualizacao e inativacao de colaboradores
- `Unidades em Atraso`: acompanhamento de inadimplencia e situacoes de cobranca
- `Ocorrencias`: registro e acompanhamento de ocorrencias operacionais
- `Financeiro`: controle visual de contas a pagar e a receber
- `Reservas e Apartamentos`: agenda de reservas e gestao de apartamentos disponiveis
- `Configuracoes`: personalizacao dos dados institucionais do condominio
- `Infraestrutura`: area voltada a apoio operacional e visao estrutural do condominio

## Tecnologias Utilizadas

### Backend

- `Node.js`
- `Express`
- `Prisma ORM`
- `PostgreSQL`
- `JWT` para autenticacao
- `bcryptjs` para hash de senhas
- `express-validator` para validacoes de entrada
- `dotenv` para variaveis de ambiente

### Frontend

- `HTML5`
- `CSS3`
- `JavaScript vanilla`
- `Font Awesome` para iconografia
- `localStorage` para persistencia de configuracoes e fluxos de demonstracao no frontend

### Ferramentas de Desenvolvimento

- `Nodemon`
- `Prisma CLI`
- `Git e GitHub`
- `Render` para publicacao inicial

## Arquitetura do Projeto

```text
NEXUS-WEBSITE/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── server.js
├── public/
│   ├── css/
│   ├── img/
│   └── js/
├── views/
│   ├── admin/
│   ├── colaborador/
│   ├── financeiro/
│   ├── morador/
│   ├── ocorrencias/
│   └── public/
└── deploy/
```

## Modelo Atual de Dados

No estado atual do projeto, o banco contempla principalmente:

- `users`
- `colaboradores`
- `veiculos`
- `ocorrencias`

O modulo financeiro atualmente possui comportamento funcional no frontend para demonstracao, com persistencia local no navegador. Caso o projeto evolua, o proximo passo natural e modelar `contas_a_pagar` e `contas_a_receber` no banco com Prisma.

## Como Executar Localmente

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variaveis de ambiente

Crie ou ajuste o arquivo `backend/.env` com os dados do PostgreSQL e da aplicacao:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco
JWT_SECRET=sua_chave_secreta
PORT=3000
HOST=0.0.0.0
```

### 3. Gerar o client do Prisma

```bash
npx prisma generate
```

### 4. Aplicar migrations

```bash
npx prisma migrate deploy
```

### 5. Popular o banco com dados iniciais

```bash
npm run seed
```

### 6. Iniciar o servidor

```bash
npm run dev
```

Depois disso, a aplicacao fica disponivel em:

- `http://localhost:3000`

## Scripts Disponiveis

Em [backend/package.json](/c:/Users/Pedro/NEXUS-WEBSITE/backend/package.json):

- `npm run dev`: inicia o servidor com `nodemon`
- `npm start`: inicia o servidor em modo normal
- `npm run prisma:generate`: gera o client do Prisma
- `npm run prisma:migrate`: executa `prisma migrate deploy`
- `npm run seed`: popula o banco com dados iniciais
- `npm run start:prod`: gera Prisma, aplica migration e inicia a aplicacao

## Autenticacao e Perfis

O projeto trabalha com perfis de acesso para cenarios administrativos e operacionais:

- `ADMIN`
- `COLABORADOR`

A autenticacao e baseada em token JWT.

## Deploy

### Render

Para publicacao rapida, o projeto pode ser executado no Render. O guia esta em [deploy/render.md](/c:/Users/Pedro/NEXUS-WEBSITE/deploy/render.md).

### Oracle Cloud / VM

Para apresentacoes academicas com menor risco de expiracao de servicos gratuitos, a opcao mais segura e uma VM com Node.js + PostgreSQL. O passo a passo esta em [deploy/oracle-vm.md](/c:/Users/Pedro/NEXUS-WEBSITE/deploy/oracle-vm.md).

## Observacoes Importantes

- O frontend ja foi adaptado para um contexto mais realista de gestao condominial.
- Parte das interacoes visuais usa `localStorage` para sustentar a demonstracao funcional.
- O backend principal hoje cobre autenticacao, colaboradores e ocorrencias.
- O projeto pode ser expandido com modulos reais de financeiro, reservas persistidas em banco e comunicacao integrada.

## Valor Academico do Projeto

O NEXUS demonstra a aplicacao integrada de conceitos de:

- desenvolvimento web full stack
- modelagem de banco de dados relacional
- autenticacao e controle de acesso
- integracao entre frontend e backend
- organizacao modular de software
- experiencia do usuario voltada a sistemas administrativos

## Autores

Projeto academico desenvolvido para conclusao de curso, em dupla.


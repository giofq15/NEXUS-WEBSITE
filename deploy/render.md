# Deploy no Render

Este projeto pode ser publicado no Render como um unico `Web Service`, porque o backend em [backend/src/server.js](/c:/Users/Pedro/NEXUS-WEBSITE/backend/src/server.js) tambem entrega o frontend estatico.

## Aviso importante

Em 25 de marco de 2026, a documentacao oficial do Render informa:

- Web services free entram em sleep apos 15 minutos sem trafego e podem levar cerca de 1 minuto para voltar
- Render Postgres free expira 30 dias apos a criacao

Fontes:

- [Deploy for Free](https://render.com/docs/free)
- [Blueprint YAML Reference](https://render.com/docs/blueprint-spec)

Se voce quer colocar no ar agora e validar o fluxo, o Render atende. Para a apresentacao final do TCC, eu nao trataria `Render Postgres free` como solucao definitiva.

## Arquitetura recomendada no Render

- 1 Web Service no Render
- 1 banco PostgreSQL remoto

Opcoes de banco:

- Temporario: Render Postgres free
- Melhor para nao depender do prazo de 30 dias do Render DB: usar um Postgres externo e configurar `DATABASE_URL` manualmente

## Arquivo ja preparado

O projeto ja tem um [render.yaml](/c:/Users/Pedro/NEXUS-WEBSITE/render.yaml) pronto para Blueprint.

Ele faz:

- install em `backend`
- `prisma generate`
- `prisma migrate deploy`
- start do Express em producao

## Publicando pelo painel

1. Suba o projeto para GitHub.
2. Entre no Render.
3. Clique em `New`.
4. Escolha `Blueprint`.
5. Conecte o repositorio.
6. Confirme o arquivo `render.yaml`.

O Render vai criar o servico `nexus-website`.

## Variaveis de ambiente

No servico, confira estas variaveis:

- `HOST=0.0.0.0`
- `JWT_SECRET` gerada automaticamente
- `DATABASE_URL` preenchida manualmente por voce

O `PORT` nao precisa ser definido manualmente, porque o Render injeta esse valor.

## Banco de dados

### Opcao 1: Render Postgres free

Serve para colocar no ar rapidamente, mas expira 30 dias apos a criacao.

Se usar essa opcao:

1. Crie um banco Postgres no Render.
2. Copie a `External Database URL` ou `Internal Database URL`.
3. Cole em `DATABASE_URL` no web service.
4. Redeploy do servico.

### Opcao 2: banco externo

Se voce tiver outro Postgres hospedado, basta colocar a connection string completa em `DATABASE_URL`.

Formato:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/nome_do_banco?schema=public"
```

## Migrando seu banco local

Se quiser levar o banco atual para um banco remoto:

```bash
pg_dump -U postgres -d nexus_db1 > nexus_db1.sql
```

Depois restaure no banco de destino com `psql` ou pela ferramenta do provedor escolhido.

## Deploy manual sem Blueprint

Se preferir criar o servico manualmente no painel, use:

- Runtime: `Node`
- Root Directory: repo root
- Build Command: `cd backend && npm ci && npm run prisma:generate && npm run prisma:migrate`
- Start Command: `cd backend && npm start`
- Health Check Path: `/health`

## Teste final

Depois do deploy, teste:

- `/health`
- `/`
- login da aplicacao

Se o deploy subir mas o login falhar, quase sempre o problema vai estar em `DATABASE_URL` ou nas migrations.

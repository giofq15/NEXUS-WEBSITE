# Setup para apresentacao com Neon e Asaas Sandbox

Este projeto pode rodar sem PostgreSQL instalado localmente. Nesta maquina, o backend usa o banco remoto definido em `backend/.env` via `DATABASE_URL`.

## 1. Preparar a maquina

Na raiz do projeto:

```bash
npm run install:backend
npm run prisma:generate
```

No backend:

```bash
npm run seed
npm start
```

O seed cria dados de demonstracao caso o banco esteja vazio.

Credenciais demo:

```text
Admin:       admin@nexus.com / admin123
Colaborador: ana.silva@nexus.com / colaborador123
Morador:     lucas.oliveira@nexus.com / morador123
```

## 2. Variaveis para usar Asaas Sandbox

No arquivo `backend/.env`, mantenha:

```env
ASAAS_API_URL="https://api-sandbox.asaas.com/v3"
ASAAS_API_KEY='$aact_hmlg_COLE_AQUI_A_CHAVE_DO_SANDBOX'
ASAAS_WEBHOOK_TOKEN="nexus-sandbox-webhook"
PUBLIC_BASE_URL="http://localhost:3000"
```

Use aspas simples na `ASAAS_API_KEY`, porque as chaves do Asaas comecam com `$` e o `dotenv` pode interpretar esse caractere se ele estiver em aspas duplas.

Para apresentacao local, `PUBLIC_BASE_URL` pode ficar como `localhost`. Se o webhook precisar ser chamado pelo Asaas durante a demonstracao, use uma URL publica temporaria e troque o `PUBLIC_BASE_URL` para essa URL.

## 3. O que fazer no Asaas Sandbox

1. Acesse `https://sandbox.asaas.com/` e crie ou entre na conta Sandbox.
2. Complete o fluxo de aprovacao da conta Sandbox. No Sandbox, a aprovacao e automatica quando os dados obrigatorios sao preenchidos.
3. Gere uma API Key da conta Sandbox.
4. Cole essa chave em `ASAAS_API_KEY` no `backend/.env`.
5. Confirme que `ASAAS_API_URL` esta apontando para `https://api-sandbox.asaas.com/v3`.
6. Reinicie o backend.
7. No sistema, acesse Financeiro e use "Gerar boleto" em uma taxa pendente.

Importante: nao misture chave de producao com URL de sandbox. Para nao gerar cobranca real, use sempre chave Sandbox com URL Sandbox.

## 4. Webhook

O backend recebe webhook em:

```text
/api/pagamentos/asaas/webhook
```

Se for configurar webhook no painel Sandbox, use:

```text
{PUBLIC_BASE_URL}/api/pagamentos/asaas/webhook
```

E configure o token/header conforme o valor de `ASAAS_WEBHOOK_TOKEN`. O backend valida o header `asaas-access-token`.

Em apresentacao local sem URL publica, a geracao da cobranca funciona, mas o Asaas nao consegue chamar o webhook de volta para atualizar automaticamente o status.

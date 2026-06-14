# 🔐 Funcionalidade de Recuperação de Senha - NEXUS

## ✅ O que foi implementado

1. **Página de "Esqueceu Senha"** - Nova página HTML (`views/public/forgot-password.html`) com:
   - Formulário para solicitação de reset de senha
   - Campo para inserir e-mail
   - Suporte para redefinição de senha via token
   - Interface responsiva seguindo o padrão do login

2. **Backend - Rotas de Reset de Senha**:
   - `POST /api/auth/forgot-password` - Solicitar link de reset
   - `POST /api/auth/reset-password` - Redefinir senha com token

3. **Database Migration**:
   - Nova tabela `password_reset_tokens` para armazenar tokens de reset
   - Tokens expiram em 1 hora por segurança

4. **Envio de Email**:
   - Integração com Nodemailer
   - Email HTML formatado com logo e instruções
   - Link seguro com token único

---

## 🚀 Como Configurar

### 1. **Configurar Variáveis de Ambiente**

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Email Configuration (Gmail)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="seu-email@gmail.com"
EMAIL_PASSWORD="sua-senha-app"
EMAIL_FROM="noreply@nexus.com"
FRONTEND_URL="http://localhost:3000"
```

### 2. **Opções de Configuração de Email**

#### **Gmail (Recomendado para Desenvolvimento)**

1. Acesse: https://myaccount.google.com/apppasswords
2. Crie uma "Senha de Aplicativo"
3. Use esta senha no `.env`

```env
EMAIL_USER="seu-email@gmail.com"
EMAIL_PASSWORD="sua-senha-app-de-16-caracteres"
```

#### **Mailtrap (Para Testes)**

1. Cadastre-se em: https://mailtrap.io
2. Copie as credenciais SMTP
3. Configure:

```env
EMAIL_HOST="smtp.mailtrap.io"
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER="seu-username"
EMAIL_PASSWORD="sua-senha"
```

#### **SendGrid (Para Produção)**

```env
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="apikey"
EMAIL_PASSWORD="SG.sua-chave-api-aqui"
```

#### **Seu Servidor SMTP Próprio**

```env
EMAIL_HOST="seu-servidor-smtp.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="seu-usuario"
EMAIL_PASSWORD="sua-senha"
```

### 3. **Variáveis Obrigatórias**

- `FRONTEND_URL` - URL do frontend (usado no link do email)
  - Desenvolvimento: `http://localhost:3000`
  - Produção: `https://seu-dominio.com`

---

## 🧪 Como Testar

### 1. **No Backend**

```bash
cd backend
npm install
npx prisma migrate deploy
npm run dev
```

### 2. **No Frontend**

1. Acesse: `http://localhost:3000/views/public/login.html`
2. Clique em "Esqueceu a senha?"
3. Digite um e-mail válido
4. Você receberá um email com o link de reset
5. Clique no link para redefinir a senha

### 3. **Testar com Mailtrap (Sem Enviar Email Real)**

```env
# Usar Mailtrap para capturar emails sem enviar
EMAIL_HOST="smtp.mailtrap.io"
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER="<seu-user>"
EMAIL_PASSWORD="<sua-senha>"
```

Acesse https://mailtrap.io/inboxes para ver os emails capturados.

---

## 📋 Fluxo de Funcionamento

### Solicitação de Reset (Forgot Password)

```
1. Usuário clica em "Esqueceu a senha?"
2. Sistema valida o e-mail
3. Gera token único (válido por 1 hora)
4. Envia e-mail com link contendo o token
5. Retorna mensagem de sucesso ao usuário
```

### Redefinição de Senha (Reset Password)

```
1. Usuário clica no link do e-mail
2. Sistema valida o token (expiração)
3. Usuário insere nova senha
4. Sistema hash a nova senha
5. Atualiza no banco de dados
6. Invalida todos os refresh tokens (força novo login)
7. Redireciona para página de login
```

---

## 🔒 Segurança

- ✅ Tokens únicos e aleatórios (crypto.randomBytes)
- ✅ Expiração de tokens em 1 hora
- ✅ Hash de senha com bcryptjs
- ✅ Mensagens genéricas (não revela se e-mail existe)
- ✅ Limpeza automática de tokens expirados
- ✅ Invalidação de sessões após reset

---

## 📁 Arquivos Modificados

- ✅ `views/public/forgot-password.html` - Nova página
- ✅ `views/public/login.html` - Link atualizado
- ✅ `backend/prisma/schema.prisma` - Novo modelo
- ✅ `backend/prisma/migrations/` - Nova migration
- ✅ `backend/src/utils/email.js` - Novo serviço de email
- ✅ `backend/src/routes/auth.routes.js` - Novas rotas
- ✅ `backend/src/controllers/auth.controller.js` - Novas funções
- ✅ `backend/.env.example` - Variáveis de email

---

## 🐛 Troubleshooting

### "Email não foi enviado"
- Verifique credenciais de email no `.env`
- Verifique se a porta SMTP está correta
- Teste com Mailtrap primeiro

### "Token expirado"
- Tokens expiram em 1 hora
- Peça novo link de reset

### "Erro de conexão"
- Verifique se o backend está rodando
- Verifique FRONTEND_URL
- Verifique logs do servidor

---

## 📧 Exemplo de Email Enviado

```
Assunto: Redefinir sua senha - NEXUS

---

Recuperação de Senha

Olá,

Recebemos uma solicitação para redefinir a senha da sua conta NEXUS.

[BOTÃO] Redefinir Senha

Ou copie este link:
https://seu-dominio.com/views/public/forgot-password.html?token=xyz...

⚠️ Este link expira em 1 hora.

---

Se você não solicitou isso, ignore este e-mail.

© 2026 NEXUS.
```

---

## 📱 Suporte a Dispositivos

- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

---

**Pronto! Sua funcionalidade de recuperação de senha está operacional! 🎉**

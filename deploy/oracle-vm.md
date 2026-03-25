# Deploy na Oracle VM Free

Este projeto pode ser publicado como um unico processo Node.js, porque o backend em [backend/src/server.js](/c:/Users/Pedro/NEXUS-WEBSITE/backend/src/server.js) tambem entrega os arquivos estaticos do frontend.

## Arquitetura recomendada

- 1 VM Ubuntu Always Free
- 1 PostgreSQL local na VM
- 1 processo Node gerenciado por PM2
- Opcional: Nginx na frente para expor porta 80 e depois HTTPS

## 1. Criar a VM

Na Oracle Cloud, crie uma instancia Ubuntu e libere no Security List:

- `22/tcp` para SSH
- `3000/tcp` se quiser acessar o Node diretamente
- `80/tcp` e `443/tcp` se usar Nginx

Anote o IP publico da VM.

## 2. Acessar por SSH

```bash
ssh ubuntu@SEU_IP_PUBLICO
```

## 3. Instalar Node.js, Git e PM2

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2
```

## 4. Instalar PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Criar banco e usuario:

```bash
sudo -u postgres psql
```

Dentro do `psql`:

```sql
CREATE DATABASE nexus_db1;
ALTER USER postgres WITH PASSWORD 'troque-esta-senha';
\q
```

## 5. Subir o codigo

```bash
git clone URL_DO_SEU_REPOSITORIO
cd NEXUS-WEBSITE/backend
npm ci
```

## 6. Configurar ambiente

Use [backend/.env.example](/c:/Users/Pedro/NEXUS-WEBSITE/backend/.env.example) como base e crie `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/nexus_db1?schema=public"
JWT_SECRET="um-segredo-longo-e-forte"
PORT=3000
HOST=0.0.0.0
PUBLIC_BASE_URL="http://SEU_IP_PUBLICO:3000"
```

Se for usar Nginx depois, troque `PUBLIC_BASE_URL` para o dominio final ou `http://SEU_IP_PUBLICO`.

## 7. Aplicar banco

```bash
npx prisma generate
npx prisma migrate deploy
```

Se quiser dados iniciais:

```bash
npm run seed
```

## 8. Subir com PM2

Ainda dentro de `backend`:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Verificar:

```bash
pm2 status
curl http://localhost:3000/health
```

## 9. Backup do banco local atual

Se voce quiser levar o banco da sua maquina para a VM, gere um dump na maquina atual:

```bash
pg_dump -U postgres -d nexus_db1 > nexus_db1.sql
```

Copie o arquivo para a VM:

```bash
scp nexus_db1.sql ubuntu@SEU_IP_PUBLICO:/home/ubuntu/
```

Na VM, restaure:

```bash
psql -U postgres -d nexus_db1 < /home/ubuntu/nexus_db1.sql
```

## 10. Atualizacao da aplicacao

```bash
cd ~/NEXUS-WEBSITE/backend
git pull
npm ci
npx prisma migrate deploy
pm2 restart nexus-backend
```

## 11. Opcional: Nginx

Se quiser expor sem `:3000`, instale o Nginx:

```bash
sudo apt install -y nginx
```

Crie `/etc/nginx/sites-available/nexus`:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/nexus
sudo nginx -t
sudo systemctl restart nginx
```

Depois disso, voce acessa pelo IP publico na porta 80.

## Checklist final

- Banco PostgreSQL rodando na VM
- `backend/.env` com credenciais corretas
- `pm2 status` mostrando `nexus-backend` online
- `curl http://localhost:3000/health` respondendo `{ "status": "ok" }`
- Porta liberada na Oracle
- Backup SQL salvo fora da VM

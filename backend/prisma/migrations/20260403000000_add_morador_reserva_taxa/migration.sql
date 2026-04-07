-- Adiciona novos valores aos enums (fora de transação no PostgreSQL)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MORADOR';
ALTER TYPE "AccessLevel" ADD VALUE IF NOT EXISTS 'MORADOR';

-- Novos enums
DO $$ BEGIN
  CREATE TYPE "PeriodoReserva" AS ENUM ('MANHA', 'TARDE', 'DIA_INTEIRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusReserva" AS ENUM ('PENDENTE', 'CONFIRMADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusTaxa" AS ENUM ('PAGA', 'PENDENTE', 'ATRASADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela moradores (entidade separada de colaboradores)
CREATE TABLE IF NOT EXISTS "moradores" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "nascimento" TIMESTAMP(3),
    "telefone" TEXT NOT NULL,
    "bloco" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "status" "StatusColaborador" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moradores_pkey" PRIMARY KEY ("id")
);

-- Tabela ocorrencias_morador
CREATE TABLE IF NOT EXISTS "ocorrencias_morador" (
    "id" SERIAL NOT NULL,
    "morador_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "status" TEXT NOT NULL DEFAULT 'EM_ANALISE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocorrencias_morador_pkey" PRIMARY KEY ("id")
);

-- Tabela areas_lazer
CREATE TABLE IF NOT EXISTS "areas_lazer" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "capacidade" INTEGER NOT NULL DEFAULT 50,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "areas_lazer_pkey" PRIMARY KEY ("id")
);

-- Tabela reservas
CREATE TABLE IF NOT EXISTS "reservas" (
    "id" SERIAL NOT NULL,
    "morador_id" INTEGER NOT NULL,
    "area_lazer_id" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "periodo" "PeriodoReserva" NOT NULL,
    "convidados" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusReserva" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- Tabela taxas
CREATE TABLE IF NOT EXISTS "taxas" (
    "id" SERIAL NOT NULL,
    "morador_id" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT 'Taxa de Condominio',
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusTaxa" NOT NULL DEFAULT 'PENDENTE',
    "pago_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taxas_pkey" PRIMARY KEY ("id")
);

-- Tabela refresh_tokens
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- Índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS "moradores_user_id_key" ON "moradores"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "moradores_cpf_key" ON "moradores"("cpf");
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- Índices de busca
CREATE INDEX IF NOT EXISTS "moradores_user_id_idx" ON "moradores"("user_id");
CREATE INDEX IF NOT EXISTS "ocorrencias_morador_morador_id_idx" ON "ocorrencias_morador"("morador_id");
CREATE INDEX IF NOT EXISTS "reservas_morador_id_idx" ON "reservas"("morador_id");
CREATE INDEX IF NOT EXISTS "reservas_area_data_idx" ON "reservas"("area_lazer_id", "data");
CREATE INDEX IF NOT EXISTS "taxas_morador_id_idx" ON "taxas"("morador_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- Foreign keys
ALTER TABLE "moradores"
    ADD CONSTRAINT "moradores_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ocorrencias_morador"
    ADD CONSTRAINT "ocorrencias_morador_morador_id_fkey"
    FOREIGN KEY ("morador_id") REFERENCES "moradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservas"
    ADD CONSTRAINT "reservas_morador_id_fkey"
    FOREIGN KEY ("morador_id") REFERENCES "moradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservas"
    ADD CONSTRAINT "reservas_area_lazer_id_fkey"
    FOREIGN KEY ("area_lazer_id") REFERENCES "areas_lazer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "taxas"
    ADD CONSTRAINT "taxas_morador_id_fkey"
    FOREIGN KEY ("morador_id") REFERENCES "moradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

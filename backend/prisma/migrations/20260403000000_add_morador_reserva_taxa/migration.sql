-- Add MORADOR to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MORADOR';

-- Create moradores table
CREATE TABLE IF NOT EXISTS "moradores" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL UNIQUE,
  "nome" TEXT NOT NULL,
  "cpf" TEXT NOT NULL UNIQUE,
  "telefone" TEXT NOT NULL,
  "bloco" TEXT NOT NULL,
  "unidade" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moradores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create areas_lazer table
CREATE TABLE IF NOT EXISTS "areas_lazer" (
  "id" SERIAL PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "capacidade" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create enums
DO $$ BEGIN
  CREATE TYPE "PeriodoReserva" AS ENUM ('MANHA', 'TARDE', 'DIA_INTEIRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatusReserva" AS ENUM ('PENDENTE', 'CONFIRMADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatusTaxa" AS ENUM ('PAGA', 'PENDENTE', 'ATRASADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create reservas table
CREATE TABLE IF NOT EXISTS "reservas" (
  "id" SERIAL PRIMARY KEY,
  "morador_id" INTEGER NOT NULL,
  "area_id" INTEGER NOT NULL,
  "data" TIMESTAMP(3) NOT NULL,
  "periodo" "PeriodoReserva" NOT NULL,
  "convidados" INTEGER NOT NULL DEFAULT 0,
  "status" "StatusReserva" NOT NULL DEFAULT 'PENDENTE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reservas_morador_id_fkey" FOREIGN KEY ("morador_id") REFERENCES "moradores"("id") ON DELETE CASCADE,
  CONSTRAINT "reservas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_lazer"("id")
);

-- Create taxas table
CREATE TABLE IF NOT EXISTS "taxas" (
  "id" SERIAL PRIMARY KEY,
  "morador_id" INTEGER NOT NULL,
  "mes" INTEGER NOT NULL,
  "ano" INTEGER NOT NULL,
  "valor" DECIMAL(10, 2) NOT NULL,
  "vencimento" TIMESTAMP(3) NOT NULL,
  "status" "StatusTaxa" NOT NULL DEFAULT 'PENDENTE',
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "taxas_morador_id_fkey" FOREIGN KEY ("morador_id") REFERENCES "moradores"("id") ON DELETE CASCADE
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create ocorrencias_morador table
CREATE TABLE IF NOT EXISTS "ocorrencias_morador" (
  "id" SERIAL PRIMARY KEY,
  "morador_id" INTEGER NOT NULL,
  "tipo" TEXT NOT NULL,
  "local" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'EM_ANALISE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ocorrencias_morador_morador_id_fkey" FOREIGN KEY ("morador_id") REFERENCES "moradores"("id") ON DELETE CASCADE
);

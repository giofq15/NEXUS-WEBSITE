-- Etapa 1: Converter coluna role para TEXT temporariamente
ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT;

-- Etapa 2: Atualizar todos os registros MORADOR para COLABORADOR
UPDATE "users" SET "role" = 'COLABORADOR' WHERE "role" = 'MORADOR';

-- Etapa 3: Remover enum antigo e recriar com novo valor
DROP TYPE "Role";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COLABORADOR');

-- Etapa 4: Reconverter coluna para o novo enum
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'COLABORADOR';

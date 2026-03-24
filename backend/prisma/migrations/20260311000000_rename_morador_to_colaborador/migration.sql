-- Etapa 1: Remover o default dependente do enum antigo
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- Etapa 2: Converter coluna role para TEXT temporariamente
ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT;

-- Etapa 3: Atualizar todos os registros MORADOR para COLABORADOR
UPDATE "users" SET "role" = 'COLABORADOR' WHERE "role" = 'MORADOR';

-- Etapa 4: Remover enum antigo e recriar com novo valor
DROP TYPE "Role";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COLABORADOR');

-- Etapa 5: Reconverter coluna para o novo enum
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'COLABORADOR';

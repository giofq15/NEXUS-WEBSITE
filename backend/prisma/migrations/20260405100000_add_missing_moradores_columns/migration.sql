-- Adiciona colunas faltantes na tabela moradores
ALTER TABLE "moradores"
  ADD COLUMN IF NOT EXISTS "nascimento" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "status" "StatusColaborador" NOT NULL DEFAULT 'PENDENTE';

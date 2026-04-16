-- taxas: adiciona descricao e renomeia paid_at -> pago_em
ALTER TABLE "taxas" ADD COLUMN IF NOT EXISTS "descricao" TEXT NOT NULL DEFAULT 'Taxa de Condominio';
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'taxas'
      AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE "taxas" RENAME COLUMN "paid_at" TO "pago_em";
  END IF;
END $$;

-- ocorrencias_morador: adiciona prioridade
ALTER TABLE "ocorrencias_morador" ADD COLUMN IF NOT EXISTS "prioridade" TEXT NOT NULL DEFAULT 'MEDIA';

-- reservas: renomeia area_id -> area_lazer_id e atualiza FK e indice
ALTER TABLE "reservas" DROP CONSTRAINT IF EXISTS "reservas_area_id_fkey";
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'reservas'
      AND column_name = 'area_id'
  ) THEN
    ALTER TABLE "reservas" RENAME COLUMN "area_id" TO "area_lazer_id";
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reservas_area_lazer_id_fkey'
  ) THEN
    ALTER TABLE "reservas" ADD CONSTRAINT "reservas_area_lazer_id_fkey"
      FOREIGN KEY ("area_lazer_id") REFERENCES "areas_lazer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "reservas_area_data_idx";
CREATE INDEX "reservas_area_data_idx" ON "reservas"("area_lazer_id", "data");

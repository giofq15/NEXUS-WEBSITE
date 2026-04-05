-- taxas: adiciona descricao e renomeia paid_at -> pago_em
ALTER TABLE "taxas" ADD COLUMN IF NOT EXISTS "descricao" TEXT NOT NULL DEFAULT 'Taxa de Condominio';
ALTER TABLE "taxas" RENAME COLUMN "paid_at" TO "pago_em";

-- ocorrencias_morador: adiciona prioridade
ALTER TABLE "ocorrencias_morador" ADD COLUMN IF NOT EXISTS "prioridade" TEXT NOT NULL DEFAULT 'MEDIA';

-- reservas: renomeia area_id -> area_lazer_id e atualiza FK e indice
ALTER TABLE "reservas" DROP CONSTRAINT IF EXISTS "reservas_area_id_fkey";
ALTER TABLE "reservas" RENAME COLUMN "area_id" TO "area_lazer_id";
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_area_lazer_id_fkey"
  FOREIGN KEY ("area_lazer_id") REFERENCES "areas_lazer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "reservas_area_data_idx";
CREATE INDEX "reservas_area_data_idx" ON "reservas"("area_lazer_id", "data");

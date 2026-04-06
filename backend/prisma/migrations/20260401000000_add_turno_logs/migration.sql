CREATE TABLE "turno_logs" (
    "id" SERIAL NOT NULL,
    "colaborador_id" INTEGER,
    "turno" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "pendencias" TEXT,
    "orientacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turno_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "turno_logs_colaborador_id_idx" ON "turno_logs"("colaborador_id");

ALTER TABLE "turno_logs"
ADD CONSTRAINT "turno_logs_colaborador_id_fkey"
FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

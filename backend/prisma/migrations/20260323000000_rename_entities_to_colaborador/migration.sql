ALTER TYPE "StatusMorador" RENAME TO "StatusColaborador";

ALTER TABLE "moradores" RENAME TO "colaboradores";
ALTER TABLE "veiculos" RENAME COLUMN "morador_id" TO "colaborador_id";
ALTER TABLE "ocorrencias" RENAME COLUMN "morador_id" TO "colaborador_id";

ALTER TABLE "colaboradores" RENAME CONSTRAINT "moradores_pkey" TO "colaboradores_pkey";
ALTER TABLE "colaboradores" RENAME CONSTRAINT "moradores_user_id_fkey" TO "colaboradores_user_id_fkey";
ALTER TABLE "veiculos" RENAME CONSTRAINT "veiculos_morador_id_fkey" TO "veiculos_colaborador_id_fkey";
ALTER TABLE "ocorrencias" RENAME CONSTRAINT "ocorrencias_morador_id_fkey" TO "ocorrencias_colaborador_id_fkey";

ALTER INDEX "moradores_user_id_key" RENAME TO "colaboradores_user_id_key";
ALTER INDEX "moradores_cpf_key" RENAME TO "colaboradores_cpf_key";
ALTER INDEX "ocorrencias_morador_id_idx" RENAME TO "ocorrencias_colaborador_id_idx";

ALTER TABLE "colaboradores"
  ALTER COLUMN "status" TYPE "StatusColaborador"
  USING "status"::text::"StatusColaborador";

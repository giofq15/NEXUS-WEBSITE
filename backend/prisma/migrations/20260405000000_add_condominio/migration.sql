-- Tabela singleton de configurações do condomínio
CREATE TABLE IF NOT EXISTS "condominio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'NEXUS',
    "razao_social" TEXT,
    "cnpj" TEXT,
    "endereco" TEXT,
    "telefone_predio" TEXT,
    "quantidade_colaboradores" INTEGER,
    "sindico" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "condominio_pkey" PRIMARY KEY ("id")
);

-- Insere o registro singleton com valores padrão
INSERT INTO "condominio" ("id", "nome", "updated_at")
VALUES (1, 'NEXUS', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

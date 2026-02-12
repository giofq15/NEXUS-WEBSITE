-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MORADOR');

-- CreateEnum
CREATE TYPE "StatusMorador" AS ENUM ('ATIVO', 'PENDENTE', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "TipoVeiculo" AS ENUM ('CARRO', 'MOTO');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MORADOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moradores" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "nascimento" TIMESTAMP(3),
    "telefone" TEXT NOT NULL,
    "bloco" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "status" "StatusMorador" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" SERIAL NOT NULL,
    "morador_id" INTEGER NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" "TipoVeiculo" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "moradores_user_id_key" ON "moradores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "moradores_cpf_key" ON "moradores"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_placa_key" ON "veiculos"("placa");

-- AddForeignKey
ALTER TABLE "moradores" ADD CONSTRAINT "moradores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_morador_id_fkey" FOREIGN KEY ("morador_id") REFERENCES "moradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

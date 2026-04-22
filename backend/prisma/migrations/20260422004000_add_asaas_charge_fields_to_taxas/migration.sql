ALTER TABLE "taxas"
  ADD COLUMN IF NOT EXISTS "asaas_customer_id" TEXT,
  ADD COLUMN IF NOT EXISTS "asaas_payment_id" TEXT,
  ADD COLUMN IF NOT EXISTS "billing_type" TEXT,
  ADD COLUMN IF NOT EXISTS "invoice_url" TEXT,
  ADD COLUMN IF NOT EXISTS "bank_slip_url" TEXT,
  ADD COLUMN IF NOT EXISTS "pix_payload" TEXT,
  ADD COLUMN IF NOT EXISTS "pix_qr_code_image" TEXT,
  ADD COLUMN IF NOT EXISTS "cobranca_gerada_em" TIMESTAMP(3);

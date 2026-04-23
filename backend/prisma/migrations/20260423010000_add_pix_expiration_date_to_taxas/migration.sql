ALTER TABLE "taxas"
  ADD COLUMN IF NOT EXISTS "pix_expiration_date" TIMESTAMP(3);

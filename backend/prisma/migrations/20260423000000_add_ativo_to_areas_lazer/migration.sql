DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'areas_lazer'
  ) THEN
    ALTER TABLE "areas_lazer" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN;
    UPDATE "areas_lazer" SET "ativo" = true WHERE "ativo" IS NULL;
    ALTER TABLE "areas_lazer" ALTER COLUMN "ativo" SET DEFAULT true;
    ALTER TABLE "areas_lazer" ALTER COLUMN "ativo" SET NOT NULL;
  END IF;
END $$;

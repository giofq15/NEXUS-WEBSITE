CREATE TYPE "AccessLevel" AS ENUM ('ROOT', 'ADMIN', 'COLABORADOR');

ALTER TABLE "users"
ADD COLUMN "access_level" "AccessLevel" NOT NULL DEFAULT 'COLABORADOR';

UPDATE "users"
SET "access_level" = CASE
  WHEN "role" = 'ADMIN' THEN 'ADMIN'::"AccessLevel"
  ELSE 'COLABORADOR'::"AccessLevel"
END;

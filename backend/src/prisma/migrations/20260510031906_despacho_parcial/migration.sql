/*
  Warnings:

  - The values [APROBADO] on the enum `StatusTicket` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusTicket_new" AS ENUM ('PENDIENTE', 'PARCIAL', 'DESPACHADO', 'RECHAZADO');
ALTER TABLE "public"."tickets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tickets" ALTER COLUMN "status" TYPE "StatusTicket_new" USING ("status"::text::"StatusTicket_new");
ALTER TYPE "StatusTicket" RENAME TO "StatusTicket_old";
ALTER TYPE "StatusTicket_new" RENAME TO "StatusTicket";
DROP TYPE "public"."StatusTicket_old";
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE';
COMMIT;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "cantidadDespachada" INTEGER NOT NULL DEFAULT 0;

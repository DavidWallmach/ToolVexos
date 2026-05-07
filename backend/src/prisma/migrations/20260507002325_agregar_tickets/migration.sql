-- CreateEnum
CREATE TYPE "StatusTicket" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'DESPACHADO');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TOOLCRIP';

-- AlterTable
ALTER TABLE "salidas" ADD COLUMN     "ticketId" TEXT;

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "herramientaId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "status" "StatusTicket" NOT NULL DEFAULT 'PENDIENTE',
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_folio_key" ON "tickets"("folio");

-- CreateIndex
CREATE INDEX "tickets_userId_idx" ON "tickets"("userId");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "herramientas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

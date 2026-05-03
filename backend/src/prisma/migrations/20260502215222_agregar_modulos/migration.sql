/*
  Warnings:

  - You are about to drop the column `ubicacion` on the `herramientas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "herramientas" DROP COLUMN "ubicacion",
ADD COLUMN     "ubicacionId" TEXT,
ADD COLUMN     "ubicacion_texto" TEXT;

-- CreateTable
CREATE TABLE "ubicaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zona" TEXT,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ubicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entradas" (
    "id" TEXT NOT NULL,
    "herramientaId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "proveedor" TEXT,
    "recibio" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entradas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salidas" (
    "id" TEXT NOT NULL,
    "herramientaId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "solicitante" TEXT NOT NULL,
    "departamento" TEXT,
    "proposito" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "empleado" TEXT NOT NULL,
    "departamento" TEXT,
    "turno" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_nombre_key" ON "ubicaciones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "personas_empleado_key" ON "personas"("empleado");

-- AddForeignKey
ALTER TABLE "herramientas" ADD CONSTRAINT "herramientas_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "herramientas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "herramientas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

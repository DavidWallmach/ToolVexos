-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISOR', 'JEFE_GRUPO', 'OPERADOR');

-- CreateEnum
CREATE TYPE "StatusHerr" AS ENUM ('DISPONIBLE', 'AGOTADO', 'MANTENIMIENTO', 'BAJA');

-- CreateEnum
CREATE TYPE "StatusPrest" AS ENUM ('ACTIVO', 'DEVUELTO', 'VENCIDO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "TipoMov" AS ENUM ('ENTRADA', 'SALIDA', 'DEVOLUCION', 'AJUSTE', 'BAJA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "empleado" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT DEFAULT '#f5a623',

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "herramientas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoriaId" TEXT NOT NULL,
    "stockTotal" INTEGER NOT NULL DEFAULT 0,
    "stockDisp" INTEGER NOT NULL DEFAULT 0,
    "stockMin" INTEGER NOT NULL DEFAULT 1,
    "ubicacion" TEXT,
    "unidad" TEXT NOT NULL DEFAULT 'pza',
    "status" "StatusHerr" NOT NULL DEFAULT 'DISPONIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "herramientas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamos" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "herramientaId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT,
    "status" "StatusPrest" NOT NULL DEFAULT 'ACTIVO',
    "fechaSalida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRetorno" TIMESTAMP(3),
    "fechaDevuelto" TIMESTAMP(3),
    "observaciones" TEXT,

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" TEXT NOT NULL,
    "herramientaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoMov" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stockAntes" INTEGER NOT NULL,
    "stockDespues" INTEGER NOT NULL,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mantenimientos" (
    "id" TEXT NOT NULL,
    "herramientaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "tecnico" TEXT,

    CONSTRAINT "mantenimientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_empleado_key" ON "users"("empleado");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "herramientas_codigo_key" ON "herramientas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "prestamos_folio_key" ON "prestamos"("folio");

-- CreateIndex
CREATE INDEX "prestamos_userId_idx" ON "prestamos"("userId");

-- CreateIndex
CREATE INDEX "prestamos_herramientaId_idx" ON "prestamos"("herramientaId");

-- CreateIndex
CREATE INDEX "movimientos_herramientaId_idx" ON "movimientos"("herramientaId");

-- AddForeignKey
ALTER TABLE "herramientas" ADD CONSTRAINT "herramientas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "herramientas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "herramientas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantenimientos" ADD CONSTRAINT "mantenimientos_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "herramientas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

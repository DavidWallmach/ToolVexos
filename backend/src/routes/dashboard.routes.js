import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect } from '../middleware/auth.middleware.js'
const router = Router()
const prisma = new PrismaClient()

router.get('/stats', protect, async (req, res, next) => {
  try {
    const [totalHerr, disponibles, prestActivos, mantenimiento, ultimosMovs, entradas, salidas] = await Promise.all([
      prisma.herramienta.count(),
      prisma.herramienta.count({ where: { status: 'DISPONIBLE' } }),
      prisma.prestamo.count({ where: { status: 'ACTIVO' } }),
      prisma.herramienta.count({ where: { status: 'MANTENIMIENTO' } }),
      prisma.movimiento.findMany({
        take: 8, orderBy: { createdAt: 'desc' },
        include: {
          herramienta: { select: { nombre: true, codigo: true } },
          user: { select: { nombre: true } }
        }
      }),
      prisma.entrada.count(),
      prisma.salida.count(),
    ])

    // Stock bajo: herramientas donde stockDisp <= stockMin
    const todas = await prisma.herramienta.findMany({ select: { stockDisp: true, stockMin: true, status: true } })
    const stockBajo = todas.filter(h => h.stockDisp <= h.stockMin && h.status !== 'BAJA').length

    res.json({ totalHerr, disponibles, prestActivos, stockBajo, mantenimiento, ultimosMovs, entradas, salidas })
  } catch (err) { next(err) }
})

export default router

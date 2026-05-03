import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect } from '../middleware/auth.middleware.js'
const router = Router()
const prisma = new PrismaClient()

router.get('/', protect, async (req, res, next) => {
  try {
    const movimientos = await prisma.movimiento.findMany({
      include: {
        herramienta: { select: { nombre: true, codigo: true } },
        user: { select: { nombre: true, empleado: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    res.json({ movimientos })
  } catch (err) { next(err) }
})
export default router

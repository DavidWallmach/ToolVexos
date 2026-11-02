import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { protect } from '../middleware/auth.middleware.js'
const router = Router()

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

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
const router = Router()
const prisma = new PrismaClient()

router.get('/', protect, async (req, res, next) => {
  try {
    const entradas = await prisma.entrada.findMany({
      include: { herramienta: { select: { nombre: true, codigo: true, unidad: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ entradas })
  } catch (err) { next(err) }
})

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { herramientaId, cantidad, proveedor, recibio, notas } = req.body
    const h = await prisma.herramienta.findUnique({ where: { id: herramientaId } })
    if (!h) return res.status(404).json({ error: 'Herramienta no encontrada.' })

    const entrada = await prisma.entrada.create({
      data: { herramientaId, cantidad: +cantidad, proveedor, recibio, notas },
      include: { herramienta: { select: { nombre: true, codigo: true, unidad: true } } }
    })

    await prisma.herramienta.update({
      where: { id: herramientaId },
      data: {
        stockDisp: { increment: +cantidad },
        stockTotal: { increment: +cantidad },
        status: 'DISPONIBLE'
      }
    })

    await prisma.movimiento.create({
      data: { herramientaId, userId: req.user.id, tipo: 'ENTRADA', cantidad: +cantidad, stockAntes: h.stockDisp, stockDespues: h.stockDisp + +cantidad, nota: `Entrada - ${proveedor || 'sin proveedor'}` }
    })

    res.status(201).json({ entrada })
  } catch (err) { next(err) }
})

export default router

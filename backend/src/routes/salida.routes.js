import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect, toolcripUp } from '../middleware/auth.middleware.js'
import { descontarStock, parseCantidad, TX_OPTS } from '../lib/stock.js'
const router = Router()
const prisma = new PrismaClient()

router.get('/', protect, async (req, res, next) => {
  try {
    const salidas = await prisma.salida.findMany({
      include: { herramienta: { select: { nombre: true, codigo: true, unidad: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ salidas })
  } catch (err) { next(err) }
})

router.post('/', protect, toolcripUp, async (req, res, next) => {
  try {
    const { herramientaId, solicitante, departamento, proposito } = req.body
    const cantidad = parseCantidad(req.body.cantidad)

    const salida = await prisma.$transaction(async (tx) => {
      const { stockAntes, stockDespues } = await descontarStock(tx, herramientaId, cantidad)
      const nueva = await tx.salida.create({
        data: { herramientaId, cantidad, solicitante, departamento, proposito },
        include: { herramienta: { select: { nombre: true, codigo: true, unidad: true } } }
      })
      await tx.movimiento.create({
        data: { herramientaId, userId: req.user.id, tipo: 'SALIDA', cantidad, stockAntes, stockDespues, nota: `Salida - ${solicitante} / ${departamento}` }
      })
      return nueva
    }, TX_OPTS)

    res.status(201).json({ salida })
  } catch (err) { next(err) }
})
export default router

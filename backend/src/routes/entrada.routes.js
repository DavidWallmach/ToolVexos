import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { protect, toolcripUp } from '../middleware/auth.middleware.js'
import { parseCantidad, sumarStock, TX_OPTS } from '../lib/stock.js'
const router = Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const entradas = await prisma.entrada.findMany({
      include: { herramienta: { select: { nombre: true, codigo: true, unidad: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ entradas })
  } catch (err) { next(err) }
})

router.post('/', protect, toolcripUp, async (req, res, next) => {
  try {
    const { herramientaId, proveedor, recibio, notas } = req.body
    const cantidad = parseCantidad(req.body.cantidad)

    const entrada = await prisma.$transaction(async (tx) => {
      const { stockAntes, stockDespues } = await sumarStock(tx, herramientaId, cantidad, { aumentarTotal: true })
      const nueva = await tx.entrada.create({
        data: { herramientaId, cantidad, proveedor, recibio, notas },
        include: { herramienta: { select: { nombre: true, codigo: true, unidad: true } } }
      })
      await tx.movimiento.create({
        data: { herramientaId, userId: req.user.id, tipo: 'ENTRADA', cantidad, stockAntes, stockDespues, nota: `Entrada - ${proveedor || 'sin proveedor'}` }
      })
      return nueva
    }, TX_OPTS)

    res.status(201).json({ entrada })
  } catch (err) { next(err) }
})
export default router

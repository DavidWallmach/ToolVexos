import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
import { TX_OPTS } from '../lib/stock.js'
const router = Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const items = await prisma.mantenimiento.findMany({
      include: { herramienta: { select: { nombre: true, codigo: true } } },
      orderBy: { fechaInicio: 'desc' }
    })
    res.json({ mantenimientos: items })
  } catch (err) { next(err) }
})

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { herramientaId, tipo, descripcion, tecnico } = req.body
    const m = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.mantenimiento.create({ data: { herramientaId, tipo, descripcion, tecnico } })
      await tx.herramienta.update({ where: { id: herramientaId }, data: { status: 'MANTENIMIENTO' } })
      return nuevo
    }, TX_OPTS)
    res.status(201).json({ mantenimiento: m })
  } catch (err) { next(err) }
})

router.put('/:id/completar', protect, adminOnly, async (req, res, next) => {
  try {
    const m = await prisma.$transaction(async (tx) => {
      const completado = await tx.mantenimiento.update({
        where: { id: req.params.id },
        data: { status: 'completado', fechaFin: new Date() }
      })
      const h = await tx.herramienta.findUnique({ where: { id: completado.herramientaId } })
      await tx.herramienta.update({ where: { id: h.id }, data: { status: h.stockDisp === 0 ? 'AGOTADO' : 'DISPONIBLE' } })
      return completado
    }, TX_OPTS)
    res.json({ mantenimiento: m })
  } catch (err) { next(err) }
})
export default router

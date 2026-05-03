import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
const router = Router()
const prisma = new PrismaClient()

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
    const m = await prisma.mantenimiento.create({ data: { herramientaId, tipo, descripcion, tecnico } })
    await prisma.herramienta.update({ where: { id: herramientaId }, data: { status: 'MANTENIMIENTO' } })
    res.status(201).json({ mantenimiento: m })
  } catch (err) { next(err) }
})

router.put('/:id/completar', protect, adminOnly, async (req, res, next) => {
  try {
    const m = await prisma.mantenimiento.update({
      where: { id: req.params.id },
      data: { status: 'completado', fechaFin: new Date() }
    })
    await prisma.herramienta.update({ where: { id: m.herramientaId }, data: { status: 'DISPONIBLE' } })
    res.json({ mantenimiento: m })
  } catch (err) { next(err) }
})
export default router

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
const router = Router()
const prisma = new PrismaClient()

router.get('/', protect, async (req, res, next) => {
  try {
    const ubicaciones = await prisma.ubicacion.findMany({
      include: { _count: { select: { herramientas: true } } },
      orderBy: { nombre: 'asc' }
    })
    res.json({ ubicaciones })
  } catch (err) { next(err) }
})

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const ub = await prisma.ubicacion.create({ data: req.body })
    res.status(201).json({ ubicacion: ub })
  } catch (err) { next(err) }
})

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await prisma.ubicacion.delete({ where: { id: req.params.id } })
    res.json({ message: 'Eliminada.' })
  } catch (err) { next(err) }
})
export default router

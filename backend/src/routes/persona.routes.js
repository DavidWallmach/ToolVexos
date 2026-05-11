import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect, toolcripUp } from '../middleware/auth.middleware.js'
const router = Router()
const prisma = new PrismaClient()

router.get('/', protect, async (req, res, next) => {
  try {
    const personas = await prisma.persona.findMany({ orderBy: { nombre: 'asc' } })
    const withCount = await Promise.all(personas.map(async p => {
      const salidas = await prisma.salida.count({ where: { solicitante: p.nombre } })
      return { ...p, _count: { salidas } }
    }))
    res.json({ personas: withCount })
  } catch (err) { next(err) }
})

router.post('/', protect, toolcripUp, async (req, res, next) => {
  try {
    const persona = await prisma.persona.create({ data: req.body })
    res.status(201).json({ persona })
  } catch (err) { next(err) }
})

router.delete('/:id', protect, toolcripUp, async (req, res, next) => {
  try {
    await prisma.persona.delete({ where: { id: req.params.id } })
    res.json({ message: 'Eliminada.' })
  } catch (err) { next(err) }
})
export default router

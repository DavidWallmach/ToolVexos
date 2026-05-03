import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
const router = Router()
const prisma = new PrismaClient()

router.get('/', protect, async (req, res, next) => {
  try {
    const cats = await prisma.categoria.findMany({ include: { _count: { select: { herramientas: true } } } })
    res.json({ categorias: cats })
  } catch (err) { next(err) }
})
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const cat = await prisma.categoria.create({ data: req.body })
    res.status(201).json({ categoria: cat })
  } catch (err) { next(err) }
})
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const cat = await prisma.categoria.update({ where: { id: req.params.id }, data: req.body })
    res.json({ categoria: cat })
  } catch (err) { next(err) }
})
export default router

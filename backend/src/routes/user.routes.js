import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
import bcrypt from 'bcryptjs'
const router = Router()
const prisma = new PrismaClient()

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, empleado: true, nombre: true, email: true, role: true, activo: true, createdAt: true }
    })
    res.json({ users })
  } catch (err) { next(err) }
})

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { empleado, nombre, email, password, role } = req.body
    const existing = await prisma.user.findUnique({ where: { empleado } })
    if (existing) return res.status(409).json({ error: 'Número de empleado ya registrado.' })
    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { empleado, nombre, email, password: hashed, role: role || 'OPERADOR' },
      select: { id: true, empleado: true, nombre: true, email: true, role: true, activo: true, createdAt: true }
    })
    res.status(201).json({ user })
  } catch (err) { next(err) }
})

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { password, ...data } = req.body
    if (password) data.password = await bcrypt.hash(password, 12)
    const user = await prisma.user.update({
      where: { id: req.params.id }, data,
      select: { id: true, empleado: true, nombre: true, email: true, role: true, activo: true }
    })
    res.json({ user })
  } catch (err) { next(err) }
})
export default router

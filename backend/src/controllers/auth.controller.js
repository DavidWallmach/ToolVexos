import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '12h' })

export const login = async (req, res, next) => {
  try {
    const { empleado, password } = req.body
    const user = await prisma.user.findUnique({ where: { empleado } })
    if (!user || !user.activo) return res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo.' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas.' })
    const token = generateToken(user.id)
    const { password: _, ...safeUser } = user
    res.json({ user: safeUser, token })
  } catch (err) { next(err) }
}

export const me = async (req, res) => {
  const { password: _, ...safeUser } = req.user
  res.json({ user: safeUser })
}

export const createUser = async (req, res, next) => {
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
}

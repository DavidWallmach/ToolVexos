import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido.' })
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || !user.activo) return res.status(401).json({ error: 'Usuario no encontrado o inactivo.' })
    req.user = user
    next()
  } catch { return res.status(401).json({ error: 'Token inválido o expirado.' }) }
}

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Solo administradores.' })
  next()
}

export const supervisorUp = (req, res, next) => {
  const allowed = ['ADMIN', 'SUPERVISOR', 'JEFE_GRUPO']
  if (!allowed.includes(req.user?.role)) return res.status(403).json({ error: 'Sin permisos para esta acción.' })
  next()
}

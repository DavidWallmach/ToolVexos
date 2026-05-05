import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import herramientaRoutes from './routes/herramienta.routes.js'
import categoriaRoutes from './routes/categoria.routes.js'
import prestamoRoutes from './routes/prestamo.routes.js'
import movimientoRoutes from './routes/movimiento.routes.js'
import mantenimientoRoutes from './routes/mantenimiento.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import entradaRoutes from './routes/entrada.routes.js'
import salidaRoutes from './routes/salida.routes.js'
import personaRoutes from './routes/persona.routes.js'
import ubicacionRoutes from './routes/ubicacion.routes.js'

import { errorHandler } from './middleware/error.middleware.js'
import { notFound } from './middleware/notFound.middleware.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://tool-vexos.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
    ]
    if (!origin || allowed.includes(origin) || origin.includes('localhost')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })
app.use('/api/', limiter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Tool Crib Manager', version: '2.1.0' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/herramientas', herramientaRoutes)
app.use('/api/categorias', categoriaRoutes)
app.use('/api/prestamos', prestamoRoutes)
app.use('/api/movimientos', movimientoRoutes)
app.use('/api/mantenimiento', mantenimientoRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/entradas', entradaRoutes)
app.use('/api/salidas', salidaRoutes)
app.use('/api/personas', personaRoutes)
app.use('/api/ubicaciones', ubicacionRoutes)

// Ruta temporal para crear admin — BORRAR DESPUÉS
app.get('/api/setup', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const bcrypt = await import('bcryptjs')
    const prisma = new PrismaClient()
    const hashed = await bcrypt.default.hash('Admin2026@', 12)
    const user = await prisma.user.upsert({
      where: { empleado: 'ADMIN-001' },
      update: { password: hashed },
      create: { empleado: 'ADMIN-001', nombre: 'David Wallmach', email: 'admin@toolcrip.com', password: hashed, role: 'ADMIN' }
    })
    await prisma.$disconnect()
    res.json({ ok: true, mensaje: 'Admin creado', empleado: user.empleado })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`\n🔧 Tool Crib Manager API → http://localhost:${PORT}`)
  console.log(`📦 Entorno: ${process.env.NODE_ENV || 'development'}\n`)
})

export default app

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect, toolcripUp } from '../middleware/auth.middleware.js'
const router = Router()
const prisma = new PrismaClient()

const genFolio = async () => {
  const count = await prisma.ticket.count()
  return `TK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
}

// GET /api/tickets — Admin/Toolcrip ve todos, supervisor/jefe ve los suyos
router.get('/', protect, async (req, res, next) => {
  try {
    const isEncargado = ['ADMIN', 'TOOLCRIP'].includes(req.user.role)
    const where = isEncargado ? {} : { userId: req.user.id }
    const { status } = req.query
    if (status) where.status = status

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: { select: { nombre: true, empleado: true, role: true } },
        herramienta: { select: { nombre: true, codigo: true, unidad: true, stockDisp: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ tickets })
  } catch (err) { next(err) }
})

// POST /api/tickets — Supervisor/Jefe crea ticket
router.post('/', protect, async (req, res, next) => {
  try {
    const { herramientaId, cantidad, motivo } = req.body
    if (!herramientaId || !cantidad || !motivo) return res.status(400).json({ error: 'Herramienta, cantidad y motivo son obligatorios.' })

    const h = await prisma.herramienta.findUnique({ where: { id: herramientaId } })
    if (!h) return res.status(404).json({ error: 'Herramienta no encontrada.' })
    if (h.stockDisp < +cantidad) return res.status(400).json({ error: `Stock insuficiente. Disponible: ${h.stockDisp} ${h.unidad}` })

    const folio = await genFolio()
    const ticket = await prisma.ticket.create({
      data: { folio, userId: req.user.id, herramientaId, cantidad: +cantidad, motivo },
      include: {
        user: { select: { nombre: true, empleado: true, role: true } },
        herramienta: { select: { nombre: true, codigo: true, unidad: true } }
      }
    })
    res.status(201).json({ ticket })
  } catch (err) { next(err) }
})

// POST /api/tickets/:id/aprobar — Solo encargado
router.post('/:id/aprobar', protect, toolcripUp, async (req, res, next) => {
  try {
    const { nota } = req.body
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { herramienta: true, user: true }
    })
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado.' })
    if (ticket.status !== 'PENDIENTE') return res.status(400).json({ error: 'El ticket ya fue procesado.' })

    const h = ticket.herramienta
    if (h.stockDisp < ticket.cantidad) return res.status(400).json({ error: 'Stock insuficiente para despachar.' })

    // Aprobar ticket y descontar stock
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'DESPACHADO', nota }
    })

    const nuevoStock = h.stockDisp - ticket.cantidad
    await prisma.herramienta.update({
      where: { id: h.id },
      data: { stockDisp: nuevoStock, status: nuevoStock === 0 ? 'AGOTADO' : 'DISPONIBLE' }
    })

    // Registrar como salida
    await prisma.salida.create({
      data: {
        herramientaId: h.id,
        cantidad: ticket.cantidad,
        solicitante: ticket.user.nombre,
        departamento: ticket.user.role,
        proposito: ticket.motivo,
        ticketId: ticket.id
      }
    })

    // Registrar movimiento
    await prisma.movimiento.create({
      data: {
        herramientaId: h.id,
        userId: req.user.id,
        tipo: 'SALIDA',
        cantidad: ticket.cantidad,
        stockAntes: h.stockDisp,
        stockDespues: nuevoStock,
        nota: `Ticket ${ticket.folio} — ${ticket.user.nombre}`
      }
    })

    res.json({ message: 'Ticket aprobado y despachado.' })
  } catch (err) { next(err) }
})

// POST /api/tickets/:id/rechazar — Solo encargado
router.post('/:id/rechazar', protect, toolcripUp, async (req, res, next) => {
  try {
    const { nota } = req.body
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } })
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado.' })
    if (ticket.status !== 'PENDIENTE') return res.status(400).json({ error: 'El ticket ya fue procesado.' })

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'RECHAZADO', nota }
    })
    res.json({ message: 'Ticket rechazado.' })
  } catch (err) { next(err) }
})

export default router

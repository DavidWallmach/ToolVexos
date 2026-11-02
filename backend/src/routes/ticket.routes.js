import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect, toolcripUp } from '../middleware/auth.middleware.js'
import { conFolio, descontarStock, HttpError, parseCantidad, TX_OPTS } from '../lib/stock.js'
const router = Router()
const prisma = new PrismaClient()

// GET — encargado ve todos, supervisor/jefe ve los suyos
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

// POST — crear ticket
router.post('/', protect, async (req, res, next) => {
  try {
    const { herramientaId, cantidad, motivo } = req.body
    if (!herramientaId || !cantidad || !motivo) {
      return res.status(400).json({ error: 'Herramienta, cantidad y motivo son obligatorios.' })
    }
    const cantidadPedida = parseCantidad(cantidad)
    const h = await prisma.herramienta.findUnique({ where: { id: herramientaId } })
    if (!h) return res.status(404).json({ error: 'Herramienta no encontrada.' })

    const ticket = await conFolio('TK', prisma.ticket, (folio) => prisma.ticket.create({
      data: { folio, userId: req.user.id, herramientaId, cantidad: cantidadPedida, motivo },
      include: {
        user: { select: { nombre: true, empleado: true, role: true } },
        herramienta: { select: { nombre: true, codigo: true, unidad: true } }
      }
    }))
    res.status(201).json({ ticket })
  } catch (err) { next(err) }
})

// POST /despachar — despacho total o parcial
router.post('/:id/despachar', protect, toolcripUp, async (req, res, next) => {
  try {
    const { cantidadDespachar, nota } = req.body
    const cantidadSolicitada = parseCantidad(cantidadDespachar)

    const resultado = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: req.params.id },
        include: { herramienta: true, user: true }
      })
      if (!ticket) throw new HttpError(404, 'Ticket no encontrado.')
      if (!['PENDIENTE', 'PARCIAL'].includes(ticket.status)) {
        throw new HttpError(400, 'El ticket ya fue procesado.')
      }

      const h = ticket.herramienta
      const cantPedida = ticket.cantidad - ticket.cantidadDespachada
      const cantDespachar = Math.min(cantidadSolicitada, h.stockDisp, cantPedida)

      if (cantDespachar <= 0) {
        throw new HttpError(400, 'No hay stock disponible para despachar.')
      }

      const totalDespachado = ticket.cantidadDespachada + cantDespachar
      const esCompleto = totalDespachado >= ticket.cantidad
      const nuevoStatus = esCompleto ? 'DESPACHADO' : 'PARCIAL'

      // Actualizar ticket: el WHERE rechaza un doble despacho simultáneo
      const { count } = await tx.ticket.updateMany({
        where: { id: ticket.id, status: ticket.status, cantidadDespachada: ticket.cantidadDespachada },
        data: {
          status: nuevoStatus,
          cantidadDespachada: totalDespachado,
          nota: nota || ticket.nota
        }
      })
      if (!count) throw new HttpError(409, 'El ticket cambió mientras se procesaba, intenta de nuevo.')

      // Descontar stock
      const { stockAntes, stockDespues } = await descontarStock(tx, h.id, cantDespachar)

      // Registrar salida
      await tx.salida.create({
        data: {
          herramientaId: h.id,
          cantidad: cantDespachar,
          solicitante: ticket.user.nombre,
          departamento: ticket.user.role,
          proposito: ticket.motivo,
          ticketId: ticket.id
        }
      })

      // Registrar movimiento
      await tx.movimiento.create({
        data: {
          herramientaId: h.id,
          userId: req.user.id,
          tipo: 'SALIDA',
          cantidad: cantDespachar,
          stockAntes,
          stockDespues,
          nota: `Ticket ${ticket.folio} — ${esCompleto ? 'COMPLETO' : 'PARCIAL'} — ${ticket.user.nombre}`
        }
      })

      return {
        message: esCompleto
          ? 'Ticket despachado completamente.'
          : `Despacho parcial: ${cantDespachar} de ${ticket.cantidad} ${h.unidad}. Pendiente: ${ticket.cantidad - totalDespachado}`,
        despachado: cantDespachar,
        pendiente: ticket.cantidad - totalDespachado,
        status: nuevoStatus
      }
    }, TX_OPTS)

    res.json(resultado)
  } catch (err) { next(err) }
})

// POST /rechazar
router.post('/:id/rechazar', protect, toolcripUp, async (req, res, next) => {
  try {
    const { nota } = req.body
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } })
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado.' })
    const { count } = await prisma.ticket.updateMany({
      where: { id: ticket.id, status: { in: ['PENDIENTE', 'PARCIAL'] } },
      data: { status: 'RECHAZADO', nota }
    })
    if (!count) return res.status(400).json({ error: 'El ticket ya fue procesado.' })
    res.json({ message: 'Ticket rechazado.' })
  } catch (err) { next(err) }
})

export default router

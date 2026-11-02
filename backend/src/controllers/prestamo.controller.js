import { PrismaClient } from '@prisma/client'
import { conFolio, descontarStock, HttpError, parseCantidad, sumarStock, TX_OPTS } from '../lib/stock.js'
const prisma = new PrismaClient()

export const getAll = async (req, res, next) => {
  try {
    const { status, userId } = req.query
    const where = {}
    if (status) where.status = status
    if (userId) where.userId = userId
    const prestamos = await prisma.prestamo.findMany({
      where,
      include: {
        user: { select: { nombre: true, empleado: true, role: true } },
        herramienta: { select: { nombre: true, codigo: true, unidad: true } }
      },
      orderBy: { fechaSalida: 'desc' }
    })
    res.json({ prestamos })
  } catch (err) { next(err) }
}

export const create = async (req, res, next) => {
  try {
    const { userId, herramientaId, motivo, fechaRetorno } = req.body
    const cantidad = parseCantidad(req.body.cantidad)

    const prestamo = await conFolio('P', prisma.prestamo, (folio) => prisma.$transaction(async (tx) => {
      const { stockAntes, stockDespues } = await descontarStock(tx, herramientaId, cantidad)
      const nuevo = await tx.prestamo.create({
        data: { folio, userId, herramientaId, cantidad, motivo, fechaRetorno: fechaRetorno ? new Date(fechaRetorno) : null },
        include: {
          user: { select: { nombre: true, empleado: true } },
          herramienta: { select: { nombre: true, codigo: true } }
        }
      })
      await tx.movimiento.create({
        data: { herramientaId, userId: req.user.id, tipo: 'SALIDA', cantidad, stockAntes, stockDespues, nota: `Préstamo ${folio}` }
      })
      return nuevo
    }, TX_OPTS))
    res.status(201).json({ prestamo })
  } catch (err) { next(err) }
}

export const devolver = async (req, res, next) => {
  try {
    const { observaciones } = req.body
    await prisma.$transaction(async (tx) => {
      const p = await tx.prestamo.findUnique({ where: { id: req.params.id } })
      if (!p) throw new HttpError(400, 'Préstamo no activo.')
      // El WHERE con status evita que una doble devolución sume el stock dos veces
      const { count } = await tx.prestamo.updateMany({
        where: { id: p.id, status: 'ACTIVO' },
        data: { status: 'DEVUELTO', fechaDevuelto: new Date(), observaciones }
      })
      if (!count) throw new HttpError(400, 'Préstamo no activo.')
      const { stockAntes, stockDespues } = await sumarStock(tx, p.herramientaId, p.cantidad)
      await tx.movimiento.create({
        data: { herramientaId: p.herramientaId, userId: req.user.id, tipo: 'DEVOLUCION', cantidad: p.cantidad, stockAntes, stockDespues, nota: `Devolución ${p.folio}` }
      })
    }, TX_OPTS)
    res.json({ message: 'Devuelto correctamente.' })
  } catch (err) { next(err) }
}

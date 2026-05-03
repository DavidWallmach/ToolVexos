import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const genFolio = async () => {
  const count = await prisma.prestamo.count()
  return `P-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
}

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
    const { userId, herramientaId, cantidad, motivo, fechaRetorno } = req.body
    const h = await prisma.herramienta.findUnique({ where: { id: herramientaId } })
    if (!h || h.stockDisp < cantidad) return res.status(400).json({ error: 'Stock insuficiente.' })

    const folio = await genFolio()
    const prestamo = await prisma.prestamo.create({
      data: { folio, userId, herramientaId, cantidad: +cantidad, motivo, fechaRetorno: fechaRetorno ? new Date(fechaRetorno) : null },
      include: {
        user: { select: { nombre: true, empleado: true } },
        herramienta: { select: { nombre: true, codigo: true } }
      }
    })
    // Descontar stock
    await prisma.herramienta.update({
      where: { id: herramientaId },
      data: { stockDisp: h.stockDisp - cantidad, status: h.stockDisp - cantidad === 0 ? 'AGOTADO' : 'DISPONIBLE' }
    })
    await prisma.movimiento.create({
      data: { herramientaId, userId: req.user.id, tipo: 'SALIDA', cantidad: +cantidad, stockAntes: h.stockDisp, stockDespues: h.stockDisp - cantidad, nota: `Préstamo ${folio}` }
    })
    res.status(201).json({ prestamo })
  } catch (err) { next(err) }
}

export const devolver = async (req, res, next) => {
  try {
    const { observaciones } = req.body
    const p = await prisma.prestamo.findUnique({ where: { id: req.params.id }, include: { herramienta: true } })
    if (!p || p.status !== 'ACTIVO') return res.status(400).json({ error: 'Préstamo no activo.' })

    await prisma.prestamo.update({
      where: { id: p.id },
      data: { status: 'DEVUELTO', fechaDevuelto: new Date(), observaciones }
    })
    const h = await prisma.herramienta.update({
      where: { id: p.herramientaId },
      data: { stockDisp: { increment: p.cantidad }, status: 'DISPONIBLE' }
    })
    await prisma.movimiento.create({
      data: { herramientaId: p.herramientaId, userId: req.user.id, tipo: 'DEVOLUCION', cantidad: p.cantidad, stockAntes: h.stockDisp - p.cantidad, stockDespues: h.stockDisp, nota: `Devolución ${p.folio}` }
    })
    res.json({ message: 'Devuelto correctamente.' })
  } catch (err) { next(err) }
}

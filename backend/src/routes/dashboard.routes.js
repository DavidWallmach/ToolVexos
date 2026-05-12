import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect } from '../middleware/auth.middleware.js'
const router = Router()
const prisma = new PrismaClient()

router.get('/stats', protect, async (req, res, next) => {
  try {
    const [totalHerr, disponibles, prestActivos, mantenimiento, ultimosMovs] = await Promise.all([
      prisma.herramienta.count(),
      prisma.herramienta.count({ where: { status: 'DISPONIBLE' } }),
      prisma.prestamo.count({ where: { status: 'ACTIVO' } }),
      prisma.herramienta.count({ where: { status: 'MANTENIMIENTO' } }),
      prisma.movimiento.findMany({
        take: 8, orderBy: { createdAt: 'desc' },
        include: {
          herramienta: { select: { nombre: true, codigo: true } },
          user: { select: { nombre: true } }
        }
      }),
    ])

    const todas = await prisma.herramienta.findMany({ select: { stockDisp: true, stockMin: true, status: true } })
    const stockBajo = todas.filter(h => h.stockDisp <= h.stockMin && h.status !== 'BAJA').length
    const ticketsPendientes = await prisma.ticket.count({ where: { status: { in: ['PENDIENTE', 'PARCIAL'] } } })

    // Top 5 materiales más solicitados
    const topMateriales = await prisma.salida.groupBy({
      by: ['herramientaId'],
      _sum: { cantidad: true },
      _count: { id: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5
    })
    const topConNombres = await Promise.all(topMateriales.map(async t => {
      const h = await prisma.herramienta.findUnique({
        where: { id: t.herramientaId },
        select: { nombre: true, codigo: true, unidad: true }
      })
      return { ...h, totalCantidad: t._sum.cantidad || 0, totalSalidas: t._count.id }
    }))

    // Movimientos últimos 7 días
    const hace7dias = new Date()
    hace7dias.setDate(hace7dias.getDate() - 6)
    hace7dias.setHours(0, 0, 0, 0)

    const movsRecientes = await prisma.movimiento.findMany({
      where: { createdAt: { gte: hace7dias } },
      select: { createdAt: true, tipo: true }
    })

    const diasMap = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }).toUpperCase()
      diasMap[key] = { entradas: 0, salidas: 0 }
    }
    movsRecientes.forEach(m => {
      const key = new Date(m.createdAt).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }).toUpperCase()
      if (diasMap[key]) {
        if (m.tipo === 'ENTRADA') diasMap[key].entradas++
        else if (m.tipo === 'SALIDA') diasMap[key].salidas++
      }
    })
    const movsSemana = Object.entries(diasMap).map(([dia, counts]) => ({ dia, ...counts }))

    // Top solicitantes
    const topSolicitantes = await prisma.salida.groupBy({
      by: ['solicitante'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    })

    res.json({
      totalHerr, disponibles, prestActivos, stockBajo, mantenimiento,
      ultimosMovs, ticketsPendientes,
      topMateriales: topConNombres,
      movsSemana,
      topSolicitantes
    })
  } catch (err) { next(err) }
})

export default router

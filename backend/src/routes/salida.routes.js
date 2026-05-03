import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect, supervisorUp } from '../middleware/auth.middleware.js'
const router = Router()
const prisma = new PrismaClient()

router.get('/', protect, async (req, res, next) => {
  try {
    const salidas = await prisma.salida.findMany({
      include: { herramienta: { select: { nombre: true, codigo: true, unidad: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ salidas })
  } catch (err) { next(err) }
})

router.post('/', protect, supervisorUp, async (req, res, next) => {
  try {
    const { herramientaId, cantidad, solicitante, departamento, proposito } = req.body
    const h = await prisma.herramienta.findUnique({ where: { id: herramientaId } })
    if (!h) return res.status(404).json({ error: 'Herramienta no encontrada.' })
    if (h.stockDisp < +cantidad) return res.status(400).json({ error: 'Stock insuficiente.' })

    const salida = await prisma.salida.create({
      data: { herramientaId, cantidad: +cantidad, solicitante, departamento, proposito },
      include: { herramienta: { select: { nombre: true, codigo: true, unidad: true } } }
    })

    const nuevoStock = h.stockDisp - +cantidad
    await prisma.herramienta.update({
      where: { id: herramientaId },
      data: { stockDisp: nuevoStock, status: nuevoStock === 0 ? 'AGOTADO' : 'DISPONIBLE' }
    })

    await prisma.movimiento.create({
      data: { herramientaId, userId: req.user.id, tipo: 'SALIDA', cantidad: +cantidad, stockAntes: h.stockDisp, stockDespues: nuevoStock, nota: `Salida - ${solicitante} / ${departamento}` }
    })

    res.status(201).json({ salida })
  } catch (err) { next(err) }
})

export default router

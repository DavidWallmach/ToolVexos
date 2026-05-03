import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const getAll = async (req, res, next) => {
  try {
    const { search, categoriaId, status } = req.query
    const where = {}
    if (search) where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { codigo: { contains: search, mode: 'insensitive' } },
    ]
    if (categoriaId) where.categoriaId = categoriaId
    if (status) where.status = status

    const herramientas = await prisma.herramienta.findMany({
      where,
      include: { categoria: true },
      orderBy: { codigo: 'asc' }
    })
    res.json({ herramientas })
  } catch (err) { next(err) }
}

export const getOne = async (req, res, next) => {
  try {
    const h = await prisma.herramienta.findUnique({
      where: { id: req.params.id },
      include: {
        categoria: true,
        mantenimientos: { orderBy: { fechaInicio: 'desc' }, take: 5 }
      }
    })
    if (!h) return res.status(404).json({ error: 'No encontrada.' })
    res.json({ herramienta: h })
  } catch (err) { next(err) }
}

export const create = async (req, res, next) => {
  try {
    const { codigo, nombre, descripcion, categoriaId, stockTotal, stockMin, ubicacion_texto, unidad } = req.body
    const h = await prisma.herramienta.create({
      data: {
        codigo,
        nombre,
        descripcion,
        categoriaId,
        stockTotal: +stockTotal,
        stockDisp: +stockTotal,
        stockMin: +(stockMin || 1),
        ubicacion_texto,
        unidad: unidad || 'pza'
      },
      include: { categoria: true }
    })
    await prisma.movimiento.create({
      data: {
        herramientaId: h.id,
        userId: req.user.id,
        tipo: 'ENTRADA',
        cantidad: +stockTotal,
        stockAntes: 0,
        stockDespues: +stockTotal,
        nota: 'Stock inicial'
      }
    })
    res.status(201).json({ herramienta: h })
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    const h = await prisma.herramienta.update({
      where: { id: req.params.id },
      data: req.body,
      include: { categoria: true }
    })
    res.json({ herramienta: h })
  } catch (err) { next(err) }
}

export const ajustarStock = async (req, res, next) => {
  try {
    const { cantidad, tipo, nota } = req.body
    const h = await prisma.herramienta.findUnique({ where: { id: req.params.id } })
    if (!h) return res.status(404).json({ error: 'No encontrada.' })

    const nuevoStock = tipo === 'ENTRADA' ? h.stockDisp + +cantidad : h.stockDisp - +cantidad
    if (nuevoStock < 0) return res.status(400).json({ error: 'Stock insuficiente.' })

    const updated = await prisma.herramienta.update({
      where: { id: req.params.id },
      data: {
        stockDisp: nuevoStock,
        stockTotal: tipo === 'ENTRADA' ? h.stockTotal + +cantidad : h.stockTotal,
        status: nuevoStock === 0 ? 'AGOTADO' : 'DISPONIBLE'
      }
    })
    await prisma.movimiento.create({
      data: {
        herramientaId: h.id,
        userId: req.user.id,
        tipo,
        cantidad: +cantidad,
        stockAntes: h.stockDisp,
        stockDespues: nuevoStock,
        nota
      }
    })
    res.json({ herramienta: updated })
  } catch (err) { next(err) }
}
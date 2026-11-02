import { PrismaClient } from '@prisma/client'
import { descontarStock, HttpError, parseCantidad, parseNoNegativo, sumarStock, TX_OPTS } from '../lib/stock.js'
const prisma = new PrismaClient()

const CAMPOS_EDITABLES = ['codigo', 'nombre', 'descripcion', 'categoriaId', 'ubicacion_texto', 'unidad']
const TIPOS_AJUSTE = ['ENTRADA', 'AJUSTE', 'BAJA']

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
      include: { categoria: true, prestamos: { include: { user: { select: { nombre: true, empleado: true } } }, orderBy: { fechaSalida: 'desc' }, take: 10 }, mantenimientos: { orderBy: { fechaInicio: 'desc' }, take: 5 } }
    })
    if (!h) return res.status(404).json({ error: 'No encontrada.' })
    res.json({ herramienta: h })
  } catch (err) { next(err) }
}

export const create = async (req, res, next) => {
  try {
    const { codigo, nombre, descripcion, categoriaId, ubicacion_texto, unidad } = req.body
    const stockTotal = parseNoNegativo(req.body.stockTotal || 0, 'El stock total')
    const stockMin = parseNoNegativo(req.body.stockMin || 1, 'El stock mínimo')
    const h = await prisma.$transaction(async (tx) => {
      const nueva = await tx.herramienta.create({
        data: { codigo, nombre, descripcion, categoriaId, stockTotal, stockDisp: stockTotal, stockMin, ubicacion_texto, unidad: unidad||'pza' },
        include: { categoria: true }
      })
      // Registrar movimiento de entrada inicial
      await tx.movimiento.create({
        data: { herramientaId: nueva.id, userId: req.user.id, tipo: 'ENTRADA', cantidad: stockTotal, stockAntes: 0, stockDespues: stockTotal, nota: 'Stock inicial' }
      })
      return nueva
    }, TX_OPTS)
    res.status(201).json({ herramienta: h })
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    // El stock solo cambia por movimientos registrados, nunca por esta ruta
    const data = Object.fromEntries(CAMPOS_EDITABLES.filter(c => req.body[c] !== undefined).map(c => [c, req.body[c]]))
    if (req.body.stockMin !== undefined) data.stockMin = parseNoNegativo(req.body.stockMin, 'El stock mínimo')
    const h = await prisma.herramienta.update({
      where: { id: req.params.id },
      data,
      include: { categoria: true }
    })
    res.json({ herramienta: h })
  } catch (err) { next(err) }
}

export const ajustarStock = async (req, res, next) => {
  try {
    const { tipo, nota } = req.body // tipo: ENTRADA | AJUSTE | BAJA
    if (!TIPOS_AJUSTE.includes(tipo)) throw new HttpError(400, 'Tipo de ajuste inválido.')
    const cantidad = parseCantidad(req.body.cantidad)
    const id = req.params.id

    const updated = await prisma.$transaction(async (tx) => {
      const { herramienta, stockAntes, stockDespues } = tipo === 'ENTRADA'
        ? await sumarStock(tx, id, cantidad, { aumentarTotal: true })
        : await descontarStock(tx, id, cantidad)
      await tx.movimiento.create({
        data: { herramientaId: id, userId: req.user.id, tipo, cantidad, stockAntes, stockDespues, nota }
      })
      return herramienta
    }, TX_OPTS)
    res.json({ herramienta: updated })
  } catch (err) { next(err) }
}

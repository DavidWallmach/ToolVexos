export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const TX_OPTS = { maxWait: 5000, timeout: 15000 }

const MAX_INT = 2147483647

const parseEntero = (valor, min, mensaje) => {
  const n = typeof valor === 'number' || typeof valor === 'string' ? Number(valor) : NaN
  if (valor === '' || !Number.isInteger(n) || n < min || n > MAX_INT) throw new HttpError(400, mensaje)
  return n
}

export const parseCantidad = (valor) =>
  parseEntero(valor, 1, 'La cantidad debe ser un número entero mayor a 0.')

export const parseNoNegativo = (valor, campo) =>
  parseEntero(valor, 0, `${campo} debe ser un número entero de 0 o más.`)

// Solo alterna DISPONIBLE/AGOTADO: MANTENIMIENTO y BAJA no se sobrescriben
const sincronizarStatus = async (tx, id) => {
  const h = await tx.herramienta.findUnique({ where: { id } })
  const status = h.stockDisp === 0 ? 'AGOTADO' : 'DISPONIBLE'
  if (['DISPONIBLE', 'AGOTADO'].includes(h.status) && h.status !== status) {
    return tx.herramienta.update({ where: { id }, data: { status } })
  }
  return h
}

// El WHERE con gte hace la validación y el descuento en un solo UPDATE atómico
export const descontarStock = async (tx, id, cantidad) => {
  const { count } = await tx.herramienta.updateMany({
    where: { id, stockDisp: { gte: cantidad } },
    data: { stockDisp: { decrement: cantidad } }
  })
  if (!count) {
    const existe = await tx.herramienta.findUnique({ where: { id } })
    if (!existe) throw new HttpError(404, 'Herramienta no encontrada.')
    throw new HttpError(400, 'Stock insuficiente.')
  }
  const herramienta = await sincronizarStatus(tx, id)
  return { herramienta, stockAntes: herramienta.stockDisp + cantidad, stockDespues: herramienta.stockDisp }
}

export const sumarStock = async (tx, id, cantidad, { aumentarTotal = false } = {}) => {
  const data = { stockDisp: { increment: cantidad } }
  if (aumentarTotal) data.stockTotal = { increment: cantidad }
  const { count } = await tx.herramienta.updateMany({ where: { id }, data })
  if (!count) throw new HttpError(404, 'Herramienta no encontrada.')
  const herramienta = await sincronizarStatus(tx, id)
  return { herramienta, stockAntes: herramienta.stockDisp - cantidad, stockDespues: herramienta.stockDisp }
}

// Si dos peticiones generan el mismo folio, la restricción única rechaza una y aquí se reintenta
export const conFolio = async (prefijo, modelo, crear, intentos = 5) => {
  for (let i = 0; i < intentos; i++) {
    const count = await modelo.count()
    const folio = `${prefijo}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
    try {
      return await crear(folio)
    } catch (err) {
      if (err.code !== 'P2002' || !err.meta?.target?.includes('folio')) throw err
    }
  }
  throw new HttpError(409, 'No se pudo generar el folio, intenta de nuevo.')
}

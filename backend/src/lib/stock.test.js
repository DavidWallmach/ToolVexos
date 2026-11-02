import test from 'node:test'
import assert from 'node:assert/strict'
import { conFolio, descontarStock, parseCantidad, parseNoNegativo, sumarStock } from './stock.js'

// Simula solo las operaciones de Prisma que usa stock.js, sin base de datos
const fakeTx = (inicial) => {
  const h = { id: 'h1', stockDisp: 0, stockTotal: 0, status: 'DISPONIBLE', ...inicial }
  const aplicar = (data) => {
    if (data.stockDisp?.decrement) h.stockDisp -= data.stockDisp.decrement
    if (data.stockDisp?.increment) h.stockDisp += data.stockDisp.increment
    if (data.stockTotal?.increment) h.stockTotal += data.stockTotal.increment
    if (data.status) h.status = data.status
  }
  return {
    h,
    herramienta: {
      findUnique: async ({ where }) => (where.id === h.id ? { ...h } : null),
      update: async ({ data }) => { aplicar(data); return { ...h } },
      updateMany: async ({ where, data }) => {
        if (where.id !== h.id || (where.stockDisp && h.stockDisp < where.stockDisp.gte)) return { count: 0 }
        aplicar(data)
        return { count: 1 }
      }
    }
  }
}

test('parseCantidad acepta enteros positivos y texto numérico', () => {
  assert.equal(parseCantidad(5), 5)
  assert.equal(parseCantidad('5'), 5)
})

test('parseCantidad rechaza negativos, cero, decimales y valores no numéricos', () => {
  for (const v of [-5, '-5', 0, '0', 1.5, '', 'abc', null, undefined, true, [], 2147483648]) {
    assert.throws(() => parseCantidad(v), { status: 400 }, `debió rechazar ${JSON.stringify(v)}`)
  }
})

test('parseNoNegativo acepta cero y rechaza negativos', () => {
  assert.equal(parseNoNegativo('0', 'Campo'), 0)
  assert.throws(() => parseNoNegativo(-1, 'Campo'), { status: 400 })
})

test('descontarStock devuelve antes/después y marca AGOTADO al llegar a 0', async () => {
  const tx = fakeTx({ stockDisp: 5 })
  const r = await descontarStock(tx, 'h1', 5)
  assert.deepEqual([r.stockAntes, r.stockDespues], [5, 0])
  assert.equal(tx.h.status, 'AGOTADO')
})

test('descontarStock rechaza stock insuficiente sin modificar nada', async () => {
  const tx = fakeTx({ stockDisp: 2 })
  await assert.rejects(descontarStock(tx, 'h1', 3), { status: 400, message: 'Stock insuficiente.' })
  assert.equal(tx.h.stockDisp, 2)
})

test('descontarStock devuelve 404 si la herramienta no existe', async () => {
  await assert.rejects(descontarStock(fakeTx({ stockDisp: 2 }), 'otra', 1), { status: 404 })
})

test('sumarStock pasa de AGOTADO a DISPONIBLE y aumenta el total solo si se pide', async () => {
  const tx = fakeTx({ stockDisp: 0, stockTotal: 4, status: 'AGOTADO' })
  const r = await sumarStock(tx, 'h1', 3)
  assert.deepEqual([r.stockAntes, r.stockDespues], [0, 3])
  assert.equal(tx.h.status, 'DISPONIBLE')
  assert.equal(tx.h.stockTotal, 4)
  await sumarStock(tx, 'h1', 1, { aumentarTotal: true })
  assert.equal(tx.h.stockTotal, 5)
})

test('MANTENIMIENTO y BAJA no se sobrescriben al mover stock', async () => {
  for (const status of ['MANTENIMIENTO', 'BAJA']) {
    const tx = fakeTx({ stockDisp: 1, status })
    await sumarStock(tx, 'h1', 2)
    await descontarStock(tx, 'h1', 3)
    assert.equal(tx.h.status, status)
  }
})

const errorFolio = () => Object.assign(new Error('duplicado'), { code: 'P2002', meta: { target: ['folio'] } })

test('conFolio reintenta con un conteo nuevo si el folio ya existe', async () => {
  let count = 6
  const modelo = { count: async () => count }
  const vistos = []
  const folio = await conFolio('TK', modelo, async (f) => {
    vistos.push(f)
    if (vistos.length === 1) { count = 7; throw errorFolio() }
    return f
  })
  const year = new Date().getFullYear()
  assert.deepEqual(vistos, [`TK-${year}-0007`, `TK-${year}-0008`])
  assert.equal(folio, `TK-${year}-0008`)
})

test('conFolio se rinde con 409 tras agotar los intentos', async () => {
  await assert.rejects(conFolio('P', { count: async () => 0 }, async () => { throw errorFolio() }), { status: 409 })
})

test('conFolio no oculta otros errores', async () => {
  const otro = Object.assign(new Error('fk'), { code: 'P2003' })
  await assert.rejects(conFolio('P', { count: async () => 0 }, async () => { throw otro }), otro)
})

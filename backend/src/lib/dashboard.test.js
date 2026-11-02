import test from 'node:test'
import assert from 'node:assert/strict'
import { inicioVentanaMeses, salidasPorMes } from './dashboard.js'

const ahora = new Date(2026, 10, 15)

test('salidasPorMes devuelve 12 meses en orden, incluidos los vacíos', () => {
  const r = salidasPorMes([], ahora)
  assert.equal(r.length, 12)
  assert.equal(r[0].mes, '2025-12')
  assert.equal(r[11].mes, '2026-11')
  assert.ok(r.every(m => m.cantidad === 0))
})

test('salidasPorMes suma por mes e ignora lo que queda fuera de la ventana', () => {
  const r = salidasPorMes([
    { createdAt: new Date(2026, 10, 1), cantidad: 2 },
    { createdAt: new Date(2026, 10, 14), cantidad: 3 },
    { createdAt: new Date(2026, 0, 31), cantidad: 4 },
    { createdAt: new Date(2025, 10, 30), cantidad: 99 },
  ], ahora)
  assert.equal(r.find(m => m.mes === '2026-11').cantidad, 5)
  assert.equal(r.find(m => m.mes === '2026-01').cantidad, 4)
  assert.equal(r.reduce((t, m) => t + m.cantidad, 0), 9)
})

test('los meses no se saltan cuando hoy es día 31', () => {
  const r = salidasPorMes([], new Date(2026, 11, 31))
  assert.equal(new Set(r.map(m => m.mes)).size, 12)
  assert.equal(r[10].mes, '2026-11')
})

test('inicioVentanaMeses empieza el día 1 del primer mes', () => {
  assert.deepEqual(inicioVentanaMeses(ahora), new Date(2025, 11, 1))
})

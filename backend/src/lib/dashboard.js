const claveMes = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`

export const inicioVentanaMeses = (ahora = new Date(), meses = 12) =>
  new Date(ahora.getFullYear(), ahora.getMonth() - (meses - 1), 1)

// Devuelve siempre los 12 meses, también los que no tuvieron salidas
export const salidasPorMes = (movimientos, ahora = new Date(), meses = 12) => {
  const totales = new Map()
  for (let i = meses - 1; i >= 0; i--) {
    totales.set(claveMes(new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)), 0)
  }
  for (const { createdAt, cantidad } of movimientos) {
    const clave = claveMes(new Date(createdAt))
    if (totales.has(clave)) totales.set(clave, totales.get(clave) + cantidad)
  }
  return [...totales].map(([mes, cantidad]) => ({ mes, cantidad }))
}

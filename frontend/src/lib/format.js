export const fechaHora = (fecha) => new Date(fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })

export const coincide = (busqueda, ...textos) => {
  const q = busqueda.trim().toLowerCase()
  return !q || textos.some(t => String(t ?? '').toLowerCase().includes(q))
}

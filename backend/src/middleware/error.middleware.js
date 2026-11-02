// middleware/error.middleware.js
const ERRORES_PRISMA = {
  P2002: [409, 'Ya existe un registro con esos datos.'],
  P2003: [400, 'Uno de los datos relacionados no existe.'],
  P2025: [404, 'Registro no encontrado.'],
}

export const errorHandler = (err, req, res, next) => {
  const [statusPrisma, mensajePrisma] = ERRORES_PRISMA[err.code] || []
  const status = err.status || statusPrisma || 500
  const esInterno = status >= 500

  if (esInterno) console.error('❌ Error:', err)

  // Los 500 nunca exponen detalles como el host de la base de datos
  res.status(status).json({
    error: esInterno ? 'Ocurrió un error interno. Intenta de nuevo.' : mensajePrisma || err.message,
  })
}

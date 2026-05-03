// middleware/error.middleware.js
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || 'Error interno del servidor'

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err)
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

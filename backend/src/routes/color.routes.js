import { Router } from 'express'

const router = Router()

// POST /api/tools/color/convert
// Convierte entre HEX, RGB, HSL
router.post('/convert', (req, res) => {
  const { color, from, to } = req.body

  // Conversión HEX → RGB
  if (from === 'hex' && to === 'rgb') {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return res.json({ result: { r, g, b }, formatted: `rgb(${r}, ${g}, ${b})` })
  }

  // RGB → HEX
  if (from === 'rgb' && to === 'hex') {
    const { r, g, b } = color
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
    return res.json({ result: hex, formatted: hex })
  }

  res.status(400).json({ error: 'Conversión no soportada aún.' })
})

// POST /api/tools/color/palette
// Genera una paleta de 5 colores desde un color base
router.post('/palette', (req, res) => {
  const { hex } = req.body
  // Aquí irá la lógica de generación de paleta
  res.json({ message: 'Paleta generada', base: hex })
})

export default router

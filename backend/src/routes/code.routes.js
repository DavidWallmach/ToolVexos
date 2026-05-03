import { Router } from 'express'

const router = Router()

// POST /api/tools/code/minify
router.post('/minify', (req, res) => {
  const { code, language } = req.body
  if (!code) return res.status(400).json({ error: 'Código requerido.' })

  // Minificación básica para JS/CSS
  const minified = code
    .replace(/\/\*[\s\S]*?\*\//g, '')   // eliminar comentarios bloque
    .replace(/\/\/[^\n]*/g, '')          // eliminar comentarios línea
    .replace(/\s+/g, ' ')               // colapsar espacios
    .trim()

  res.json({ result: minified, originalSize: code.length, minifiedSize: minified.length })
})

// POST /api/tools/code/format
router.post('/format', (req, res) => {
  const { code, language } = req.body
  // Aquí integrarías prettier programáticamente
  res.json({ result: code, message: 'Formateo próximamente con Prettier' })
})

// POST /api/tools/code/base64
router.post('/base64', (req, res) => {
  const { text, mode } = req.body // mode: 'encode' | 'decode'
  if (mode === 'encode') return res.json({ result: Buffer.from(text).toString('base64') })
  if (mode === 'decode') return res.json({ result: Buffer.from(text, 'base64').toString('utf-8') })
  res.status(400).json({ error: 'mode debe ser encode o decode' })
})

export default router

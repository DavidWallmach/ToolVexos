import { Router } from 'express'

const router = Router()

// POST /api/tools/file/json-to-csv
router.post('/json-to-csv', (req, res) => {
  try {
    const { json } = req.body
    const data = typeof json === 'string' ? JSON.parse(json) : json

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'El JSON debe ser un array de objetos.' })
    }

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
      ),
    ]

    res.json({ result: csvRows.join('\n') })
  } catch {
    res.status(400).json({ error: 'JSON inválido.' })
  }
})

// POST /api/tools/file/csv-to-json
router.post('/csv-to-json', (req, res) => {
  try {
    const { csv } = req.body
    const lines = csv.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const result = lines.slice(1).map(line => {
      const values = line.split(',')
      return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim()]))
    })
    res.json({ result })
  } catch {
    res.status(400).json({ error: 'CSV inválido.' })
  }
})

export default router

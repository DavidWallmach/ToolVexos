import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const prisma = new PrismaClient()

// ─── Generar texto ───────────────────────────────────────────
export const generateText = async (req, res, next) => {
  try {
    const { prompt, tone = 'neutral', length = 'medium' } = req.body

    const lengthMap = { short: 100, medium: 250, long: 500 }
    const maxWords = lengthMap[length] || 250

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente de escritura. Responde en el tono "${tone}". Máximo ${maxWords} palabras.`,
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxWords * 2,
    })

    const result = completion.choices[0].message.content

    // Guardar historial
    await prisma.toolUsage.create({
      data: {
        userId: req.user.id,
        toolSlug: 'ai-generator',
        input: { prompt: prompt.substring(0, 100), tone, length },
      },
    })

    res.json({ result })
  } catch (err) {
    next(err)
  }
}

// ─── Resumir texto ───────────────────────────────────────────
export const summarize = async (req, res, next) => {
  try {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'Texto requerido.' })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Resume el siguiente texto en 3-5 oraciones claras y concisas.' },
        { role: 'user', content: text },
      ],
      max_tokens: 300,
    })

    res.json({ result: completion.choices[0].message.content })
  } catch (err) {
    next(err)
  }
}

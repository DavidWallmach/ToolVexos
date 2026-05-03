import { Router } from 'express'
import { generateText, summarize } from '../controllers/ai.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

// POST /api/tools/ai/generate
router.post('/generate', protect, generateText)

// POST /api/tools/ai/summarize
router.post('/summarize', protect, summarize)

export default router

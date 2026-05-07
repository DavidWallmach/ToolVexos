import { Router } from 'express'
import { getAll, getOne, create, update, ajustarStock } from '../controllers/herramienta.controller.js'
import { protect, toolcripUp } from '../middleware/auth.middleware.js'
const router = Router()
router.get('/', protect, getAll)
router.get('/:id', protect, getOne)
router.post('/', protect, toolcripUp, create)
router.put('/:id', protect, toolcripUp, update)
router.post('/:id/stock', protect, toolcripUp, ajustarStock)
export default router

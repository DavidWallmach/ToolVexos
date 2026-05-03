import { Router } from 'express'
import { getAll, getOne, create, update, ajustarStock } from '../controllers/herramienta.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
const router = Router()
router.get('/', protect, getAll)
router.get('/:id', protect, getOne)
router.post('/', protect, adminOnly, create)
router.put('/:id', protect, adminOnly, update)
router.post('/:id/stock', protect, adminOnly, ajustarStock)
export default router

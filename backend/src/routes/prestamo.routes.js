import { Router } from 'express'
import { getAll, create, devolver } from '../controllers/prestamo.controller.js'
import { protect, supervisorUp } from '../middleware/auth.middleware.js'
const router = Router()
router.get('/', protect, getAll)
router.post('/', protect, supervisorUp, create)
router.post('/:id/devolver', protect, supervisorUp, devolver)
export default router

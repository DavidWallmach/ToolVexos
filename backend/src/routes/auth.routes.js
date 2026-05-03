import { Router } from 'express'
import { login, me, createUser } from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { adminOnly } from '../middleware/auth.middleware.js'

const router = Router()
router.post('/login', login)
router.get('/me', protect, me)
router.post('/users', protect, adminOnly, createUser)
export default router

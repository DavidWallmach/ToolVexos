import { PrismaClient } from '@prisma/client'

// Un solo cliente para toda la API: cada PrismaClient abre su propio grupo de conexiones
export const prisma = new PrismaClient()

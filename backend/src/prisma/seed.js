import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Admin principal
  const hashed = await bcrypt.hash('Admin2026@', 12)
  const admin = await prisma.user.upsert({
    where: { empleado: 'ADMIN-001' },
    update: {},
    create: { empleado: 'ADMIN-001', nombre: 'David Wallmach', email: 'admin@toolcrip.com', password: hashed, role: 'ADMIN' }
  })
  console.log('✅ Admin creado:', admin.empleado)

  // Categorías base
  const cats = ['Herramienta de mano','Herramienta eléctrica','Instrumentos de medición','Material consumible','ESD / Electrónico','Equipo de seguridad']
  for (const nombre of cats) {
    await prisma.categoria.upsert({ where: { nombre }, update: {}, create: { nombre } })
  }
  console.log('✅ Categorías creadas')

  console.log('\n🔑 CREDENCIALES DE ACCESO:')
  console.log('   Empleado: ADMIN-001')
  console.log('   Password: Admin2026@')
}

main().catch(console.error).finally(() => prisma.$disconnect())

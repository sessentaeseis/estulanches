import 'dotenv/config'
import bcrypt from 'bcrypt'
import { prisma } from './lib/prisma.js'

const { ADMIN_NAME = 'Administrador', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD com pelo menos 12 caracteres.')
}

const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
await prisma.user.upsert({
  where: { email: ADMIN_EMAIL.toLowerCase() },
  update: {},
  create: { name: ADMIN_NAME, email: ADMIN_EMAIL.toLowerCase(), passwordHash },
})
await prisma.$disconnect()

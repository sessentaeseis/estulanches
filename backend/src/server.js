import 'dotenv/config'
import { configureDatabaseUrl } from './lib/database-url.js'

process.env.DATABASE_URL = configureDatabaseUrl()

for (const key of ['JWT_SECRET']) {
  if (!process.env[key]) throw new Error(`Variável ${key} não definida.`)
}
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres.')

const [{ createApp }, { prisma }] = await Promise.all([
  import('./app.js'),
  import('./lib/prisma.js'),
])

const port = Number(process.env.PORT ?? 3000)
const app = createApp({ prisma, jwtSecret: process.env.JWT_SECRET, frontendOrigin: process.env.FRONTEND_ORIGIN })
const server = app.listen(port, '0.0.0.0', () => console.log(`API EstuLanches disponível na porta ${port}.`))

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  }))
}

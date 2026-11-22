import 'dotenv/config'
import { spawn, spawnSync } from 'node:child_process'
import { configureDatabaseUrl } from './lib/database-url.js'

process.env.DATABASE_URL = configureDatabaseUrl()

for (const args of [['run', 'db:migrate'], ['run', 'seed']]) {
  const result = spawnSync('npm', args, { stdio: 'inherit', env: process.env, shell: true })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const server = spawn(process.execPath, ['src/server.js'], { stdio: 'inherit', env: process.env })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal))
server.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))

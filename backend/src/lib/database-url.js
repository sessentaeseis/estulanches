export function configureDatabaseUrl(environment = process.env) {
  if (environment.DATABASE_URL) return environment.DATABASE_URL

  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
  for (const key of required) {
    if (!environment[key]) throw new Error(`Variável ${key} não definida.`)
  }

  const host = environment.DB_HOST
  const port = environment.DB_PORT || '5432'
  const database = encodeURIComponent(environment.DB_NAME)
  const username = encodeURIComponent(environment.DB_USER)
  const password = encodeURIComponent(environment.DB_PASSWORD)
  return `postgresql://${username}:${password}@${host}:${port}/${database}`
}

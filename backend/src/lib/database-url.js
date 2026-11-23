export function configureDatabaseUrl(environment = process.env) {
  if (environment.DATABASE_URL) return environment.DATABASE_URL

  const database = {
    DB_HOST: environment.DB_HOST || (environment.POSTGRES_PASSWORD ? 'localhost' : ''),
    DB_PORT: environment.DB_PORT || '5432',
    DB_NAME: environment.DB_NAME || (environment.POSTGRES_PASSWORD ? 'estulanches' : ''),
    DB_USER: environment.DB_USER || (environment.POSTGRES_PASSWORD ? 'estulanches' : ''),
    DB_PASSWORD: environment.DB_PASSWORD || environment.POSTGRES_PASSWORD,
  }

  const missing = Object.entries(database).filter(([key, value]) => key !== 'DB_PORT' && !value).map(([key]) => key)
  if (missing.length) throw new Error(`Configure DATABASE_URL ou as variáveis ${missing.join(', ')}.`)

  const name = encodeURIComponent(database.DB_NAME)
  const username = encodeURIComponent(database.DB_USER)
  const password = encodeURIComponent(database.DB_PASSWORD)
  return `postgresql://${username}:${password}@${database.DB_HOST}:${database.DB_PORT}/${name}`
}

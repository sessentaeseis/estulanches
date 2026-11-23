import test from 'node:test'
import assert from 'node:assert/strict'
import { configureDatabaseUrl } from '../../src/lib/database-url.js'

test('codifica caracteres especiais na senha da URL PostgreSQL', () => {
  const url = configureDatabaseUrl({
    DB_HOST: 'database',
    DB_PORT: '5432',
    DB_NAME: 'estu lanches',
    DB_USER: 'cantina',
    DB_PASSWORD: 'senha@:/!#%',
  })
  const parsed = new URL(url)
  assert.equal(parsed.hostname, 'database')
  assert.equal(parsed.pathname, '/estu%20lanches')
  assert.equal(decodeURIComponent(parsed.password), 'senha@:/!#%')
})

test('preserva DATABASE_URL quando ela já está configurada', () => {
  assert.equal(configureDatabaseUrl({ DATABASE_URL: 'postgresql://localhost:5432/estu' }), 'postgresql://localhost:5432/estu')
})

test('usa a configuração local do Compose para desenvolvimento', () => {
  const url = configureDatabaseUrl({ POSTGRES_PASSWORD: 'local@password' })
  const parsed = new URL(url)
  assert.equal(parsed.hostname, 'localhost')
  assert.equal(parsed.pathname, '/estulanches')
  assert.equal(parsed.username, 'estulanches')
  assert.equal(decodeURIComponent(parsed.password), 'local@password')
})

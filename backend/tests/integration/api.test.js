import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../../src/app.js'

function createDatabase() {
  const products = [{ id: 'pao', name: 'Pão de queijo', price: '5.00', category: 'Lanches', available: true }]
  const orders = []
  return {
    products,
    orders,
    $queryRaw: async () => [{ '?column?': 1 }],
    product: {
      findMany: async ({ where } = {}) => where?.id?.in ? products.filter((product) => where.id.in.includes(product.id) && product.available) : products.filter((product) => product.available),
      create: async ({ data }) => { const product = { id: 'novo', ...data }; products.push(product); return product },
    },
    order: {
      create: async ({ data }) => { const order = { id: 'pedido-1', ...data, items: [] }; orders.push(order); return order },
    },
    user: { findUnique: async () => null },
  }
}

test('health endpoint verifies database availability', async () => {
  const app = createApp({ prisma: createDatabase(), jwtSecret: 'test-secret' })
  const server = app.listen(0)
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/health`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'ok', database: 'connected' })
  } finally {
    server.close()
  }
})

test('creates an order with prices calculated from the menu', async () => {
  const app = createApp({ prisma: createDatabase(), jwtSecret: 'test-secret' })
  const server = app.listen(0)
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: 'Ana Lima', classroom: '7º A', items: [{ productId: 'pao', quantity: 2 }] }),
    })
    assert.equal(response.status, 201)
    assert.equal((await response.json()).total, '10.00')
  } finally {
    server.close()
  }
})

test('rejects orders without items', async () => {
  const app = createApp({ prisma: createDatabase(), jwtSecret: 'test-secret' })
  const server = app.listen(0)
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: 'Ana Lima', classroom: '7º A', items: [] }),
    })
    assert.equal(response.status, 400)
  } finally {
    server.close()
  }
})

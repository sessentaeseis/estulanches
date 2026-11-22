import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateOrderTotal } from '../../src/app.js'

test('calcula o total dos produtos pela quantidade', () => {
  const products = [{ id: 'sanduiche', price: '8.50' }, { id: 'suco', price: '4.00' }]
  const quantities = new Map([['sanduiche', 2], ['suco', 1]])
  assert.equal(calculateOrderTotal(products, quantities), 21)
})

test('calcula corretamente uma lista com um produto', () => {
  assert.equal(calculateOrderTotal([{ id: 'agua', price: 3 }], new Map([['agua', 4]])), 12)
})

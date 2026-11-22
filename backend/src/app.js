import bcrypt from 'bcrypt'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'

const orderStatuses = ['RECEBIDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO']

export function calculateOrderTotal(products, quantities) {
  return products.reduce((sum, product) => sum + Number(product.price) * quantities.get(product.id), 0)
}

export function createApp({ prisma, jwtSecret, frontendOrigin = 'http://localhost:5173' }) {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: frontendOrigin }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      res.json({ status: 'ok', database: 'connected' })
    } catch {
      res.status(503).json({ status: 'error', database: 'unavailable' })
    }
  })

  app.post('/api/auth/login', async (req, res) => {
    const email = String(req.body.email ?? '').trim().toLowerCase()
    const password = String(req.body.password ?? '')
    if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' })
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '8h' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  })

  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'Autenticação necessária.' })
    try {
      req.user = jwt.verify(token, jwtSecret)
      next()
    } catch {
      res.status(401).json({ error: 'Sessão inválida ou expirada.' })
    }
  }

  app.get('/api/products', async (req, res) => {
    const products = await prisma.product.findMany({ where: { available: true }, orderBy: { name: 'asc' } })
    res.json(products)
  })

  app.post('/api/products', authenticate, async (req, res) => {
    const { name, description, category } = req.body
    const price = Number(req.body.price)
    if (!name?.trim() || !category?.trim() || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Informe nome, categoria e preço válido.' })
    }
    const product = await prisma.product.create({
      data: { name: name.trim(), description: description?.trim() || null, category: category.trim(), price },
    })
    res.status(201).json(product)
  })

  app.patch('/api/products/:id', authenticate, async (req, res) => {
    const data = {}
    if (typeof req.body.available === 'boolean') data.available = req.body.available
    if (req.body.name?.trim()) data.name = req.body.name.trim()
    if (req.body.category?.trim()) data.category = req.body.category.trim()
    if (req.body.price !== undefined) {
      const price = Number(req.body.price)
      if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Preço inválido.' })
      data.price = price
    }
    try {
      const product = await prisma.product.update({ where: { id: req.params.id }, data })
      res.json(product)
    } catch {
      res.status(404).json({ error: 'Produto não encontrado.' })
    }
  })

  app.get('/api/orders', authenticate, async (req, res) => {
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json(orders)
  })

  app.post('/api/orders', async (req, res) => {
    const { customer, classroom, items } = req.body
    if (!customer?.trim() || !classroom?.trim() || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Informe aluno, turma e ao menos um item.' })
    }
    const quantities = new Map()
    for (const item of items) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) {
        return res.status(400).json({ error: 'Itens ou quantidades inválidas.' })
      }
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
    }
    const products = await prisma.product.findMany({
      where: { id: { in: [...quantities.keys()] }, available: true },
    })
    if (products.length !== quantities.size) return res.status(400).json({ error: 'Um ou mais produtos não estão disponíveis.' })
    const total = calculateOrderTotal(products, quantities)
    const order = await prisma.order.create({
      data: {
        customer: customer.trim(),
        classroom: classroom.trim(),
        total: total.toFixed(2),
        items: { create: products.map((product) => ({ productId: product.id, quantity: quantities.get(product.id), unitPrice: product.price })) },
      },
      include: { items: { include: { product: true } } },
    })
    res.status(201).json(order)
  })

  app.patch('/api/orders/:id/status', authenticate, async (req, res) => {
    if (!orderStatuses.includes(req.body.status)) return res.status(400).json({ error: 'Status inválido.' })
    try {
      const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: req.body.status } })
      res.json(order)
    } catch {
      res.status(404).json({ error: 'Pedido não encontrado.' })
    }
  })

  app.use((error, req, res, next) => {
    console.error(error)
    res.status(500).json({ error: 'Não foi possível concluir a solicitação.' })
  })

  return app
}

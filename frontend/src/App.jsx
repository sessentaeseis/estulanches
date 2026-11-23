import { useEffect, useMemo, useState } from 'react'
import './App.css'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const money = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function App() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [cart, setCart] = useState({})
  const [customer, setCustomer] = useState('')
  const [classroom, setClassroom] = useState('')
  const [notice, setNotice] = useState('')
  const [token, setToken] = useState(localStorage.getItem('estu-token') ?? '')
  const [login, setLogin] = useState({ email: '', password: '' })
  const [productForm, setProductForm] = useState({ name: '', category: 'Lanches', price: '', description: '' })
  const [section, setSection] = useState('cardapio')

  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token])

  async function request(path, options = {}) {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...headers, ...options.headers },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? 'Ocorreu um erro.')
    return data
  }

  async function loadProducts() {
    setProducts(await request('/products'))
  }

  async function loadOrders() {
    setOrders(await request('/orders'))
  }

  useEffect(() => {
    let active = true
    fetch(`${apiUrl}/products`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar o cardápio.')
        return response.json()
      })
      .then((data) => { if (active) setProducts(data) })
      .catch((error) => { if (active) setNotice(error.message) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true
    fetch(`${apiUrl}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Sessão expirada.')
        return response.json()
      })
      .then((data) => { if (active) setOrders(data) })
      .catch(() => {
        if (!active) return
        localStorage.removeItem('estu-token')
        setToken('')
      })
    return () => { active = false }
  }, [token])

  const cartTotal = products.reduce((sum, product) => sum + Number(product.price) * (cart[product.id] ?? 0), 0)

  async function placeOrder(event) {
    event.preventDefault()
    try {
      await request('/orders', {
        method: 'POST',
        body: JSON.stringify({ customer, classroom, items: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })) }),
      })
      setCart({})
      setCustomer('')
      setClassroom('')
      setNotice('Pedido enviado para a cantina.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function signIn(event) {
    event.preventDefault()
    try {
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify(login), headers: {} })
      localStorage.setItem('estu-token', result.token)
      setToken(result.token)
      setLogin({ email: '', password: '' })
      setNotice(`Olá, ${result.user.name}.`)
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function addProduct(event) {
    event.preventDefault()
    try {
      await request('/products', { method: 'POST', body: JSON.stringify(productForm) })
      setProductForm({ name: '', category: 'Lanches', price: '', description: '' })
      await loadProducts()
      setNotice('Produto adicionado ao cardápio.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function updateStatus(id, status) {
    try {
      await request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await loadOrders()
    } catch (error) {
      setNotice(error.message)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="EstuLanches início"><span className="brand-mark">E</span><span>Estu<span className="brand-light">Lanches</span></span></a>
        <nav aria-label="Navegação principal">
          <button className={section === 'cardapio' ? 'nav-link active' : 'nav-link'} onClick={() => setSection('cardapio')}>Cardápio</button>
          <button className={section === 'gestao' ? 'nav-link active' : 'nav-link'} onClick={() => setSection('gestao')}>Gestão</button>
        </nav>
        <span className="service-status"><i />Cantina aberta</span>
      </header>

      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso">×</button></div>}

      {section === 'cardapio' ? (
        <>
          <section className="intro" id="inicio">
            <div><p className="eyebrow">ESTULANCHES</p><h1>Cardápio da cantina</h1><p className="intro-copy">Escolha os produtos, informe sua turma e envie o pedido.</p></div>
            <div className="today-card"><span>Pedidos do intervalo</span><strong>Confira as opções de hoje</strong><small>Os pedidos são retirados no balcão.</small></div>
          </section>

          <section className="menu-layout">
            <div className="menu-main">
              <div className="section-heading"><div><p className="eyebrow">FEITO HOJE</p><h2>Nosso cardápio</h2></div><span>{products.length} opções</span></div>
              <div className="product-list">
                {products.map((product) => <article className="product-card" key={product.id}>
                  <div className="product-info"><span className="category-label">{product.category}</span><h3>{product.name}</h3><p>{product.description || 'Preparado fresquinho para o seu intervalo.'}</p><strong>{money(product.price)}</strong></div>
                  <button className="add-button" onClick={() => setCart((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }))} aria-label={`Adicionar ${product.name}`}>+</button>
                  {cart[product.id] > 0 && <span className="item-count">{cart[product.id]}</span>}
                </article>)}
                {products.length === 0 && <p className="empty-state">O cardápio ainda está sendo preparado.</p>}
              </div>
            </div>

            <aside className="order-panel">
              <div className="order-title"><div><p className="eyebrow">SEU INTERVALO</p><h2>Seu pedido</h2></div><span className="cart-count">{Object.values(cart).reduce((sum, count) => sum + count, 0)}</span></div>
              <form onSubmit={placeOrder}>
                <label>Seu nome<input required value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Nome e sobrenome" /></label>
                <label>Turma<input required value={classroom} onChange={(event) => setClassroom(event.target.value)} placeholder="Ex.: 7º A" /></label>
                <div className="order-total"><span>Total</span><strong>{money(cartTotal)}</strong></div>
                <button className="primary-button" disabled={!Object.keys(cart).length}>Enviar pedido <span>→</span></button>
              </form>
              <p className="order-help">O pagamento é feito na retirada, direto no balcão.</p>
            </aside>
          </section>
          <footer><span>EstuLanches <span className="brand-light">· Cantina escolar</span></span><span>Feito para um recreio melhor.</span></footer>
        </>
      ) : (
        <section className="management">
          {!token ? <form className="management-card login-card" onSubmit={signIn}><p className="eyebrow">ÁREA RESTRITA</p><h1>Acesso da cantina</h1><label>E-mail<input type="email" required value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} /></label><label>Senha<input type="password" required value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} /></label><button className="primary-button">Entrar</button></form> : <div className="management-grid">
            <form className="management-card" onSubmit={addProduct}><p className="eyebrow">CARDÁPIO</p><h2>Novo produto</h2><label>Nome<input required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label><label>Categoria<input required value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} /></label><label>Preço (R$)<input required type="number" min="0.01" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /></label><label>Descrição<input value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label><button className="primary-button">Adicionar produto</button></form>
            <div className="management-card orders-card"><div className="section-heading"><div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Pedidos recentes</h2></div><button className="text-button" onClick={() => loadOrders()}>Atualizar</button></div>{orders.map((order) => <article className="order-row" key={order.id}><div><strong>{order.customer}</strong><span>{order.classroom} · {money(order.total)}</span></div><select aria-label={`Status do pedido de ${order.customer}`} value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>{['RECEBIDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'].map((status) => <option key={status}>{status}</option>)}</select></article>)}{orders.length === 0 && <p className="empty-state">Nenhum pedido recebido ainda.</p>}</div>
          </div>}
        </section>
      )}
    </main>
  )
}

export default App

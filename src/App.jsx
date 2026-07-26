import { useState, useMemo, useEffect } from 'react'
import { defaultProducts } from './data/products'
import { useLocalStorage } from './hooks/useLocalStorage'
import { getProducts, seedProducts } from './utils/db'
import Header from './components/Header'
import ProductGrid from './components/ProductGrid'
import Ticket from './components/Ticket'
import WeightModal from './components/WeightModal'
import PaymentModal from './components/PaymentModal'
import TicketPreview from './components/TicketPreview'
import SideMenu from './components/SideMenu'
import Products from './components/Products'
import './App.css'

function App() {
  const [cart, setCart] = useLocalStorage('fruteria-cart', [])
  const [tasa, setTasa] = useLocalStorage('fruteria-tasa', 36.50)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentFilter, setCurrentFilter] = useState('todos')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      setLoadingProducts(true)
      await seedProducts(defaultProducts)
      const list = await getProducts()
      setProducts(list.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error('Error inicializando productos:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const filteredProducts = useMemo(() => {
    let result = products
    if (currentFilter !== 'todos') {
      result = result.filter((p) => p.group === currentFilter)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(term))
    }
    return result
  }, [currentFilter, searchTerm, products])

  const totals = useMemo(() => {
    const totalUSD = cart.reduce((sum, item) => sum + item.totalUSD, 0)
    const totalBS = totalUSD * tasa
    return { totalUSD, totalBS, count: cart.length }
  }, [cart, tasa])

  const addToCart = (product, qty) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        const newQty = existing.qty + qty
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: newQty, totalUSD: newQty * item.price }
            : item
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          icon: product.icon,
          um: product.um,
          price: product.price,
          qty,
          totalUSD: qty * product.price,
        },
      ]
    })
  }

  const removeItem = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const clearCart = () => {
    if (cart.length === 0) return
    if (confirm('¿Vaciar el ticket?')) {
      setCart([])
    }
  }

  const completePayment = (method) => {
    const methodNames = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transfer: 'Transferencia',
      qr: 'QR/Yape',
    }
    alert(
      `✅ Pago completado!\n\nTotal: $${totals.totalUSD.toFixed(2)}\nMétodo: ${methodNames[method]}\n\n¡Gracias por su compra!`
    )
    setCart([])
    setPaymentOpen(false)
  }

  return (
    <div className="app">
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpen={() => setIsMenuOpen(true)}
        currentFilter={currentFilter}
        onFilterChange={(filter) => {
          if (filter === 'productos') {
            setProductsOpen(true)
          } else {
            setCurrentFilter(filter)
          }
          setIsMenuOpen(false)
        }}
      />
      <Header
        cartCount={totals.count}
        totalUSD={totals.totalUSD}
        totalBS={totals.totalBS}
        tasa={tasa}
        onTasaChange={setTasa}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuToggle={() => setIsMenuOpen(true)}
      />
      <main className="main">
        {loadingProducts ? (
          <div className="products-loading">Cargando productos...</div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            cart={cart}
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
            onSelectProduct={setSelectedProduct}
            tasa={tasa}
          />
        )}
        <Ticket
          cart={cart}
          totals={totals}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onOpenPayment={() => setPaymentOpen(true)}
          onOpenPreview={() => setPreviewOpen(true)}
        />
      </main>

      {selectedProduct && (
        <WeightModal
          product={selectedProduct}
          tasa={tasa}
          onClose={() => setSelectedProduct(null)}
          onConfirm={(qty) => {
            addToCart(selectedProduct, qty)
            setSelectedProduct(null)
          }}
        />
      )}

      {paymentOpen && (
        <PaymentModal
          totals={totals}
          onClose={() => setPaymentOpen(false)}
          onConfirm={completePayment}
        />
      )}

      {previewOpen && (
        <TicketPreview
          cart={cart}
          totals={totals}
          tasa={tasa}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {productsOpen && (
        <Products
          onClose={() => {
            setProductsOpen(false)
            loadProducts()
          }}
        />
      )}
    </div>
  )

  async function loadProducts() {
    try {
      setLoadingProducts(true)
      const list = await getProducts()
      setProducts(list)
    } catch (error) {
      console.error('Error recargando productos:', error)
    } finally {
      setLoadingProducts(false)
    }
  }
}

export default App

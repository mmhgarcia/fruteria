import { useState, useMemo, useEffect } from 'react'
import { defaultProducts } from './data/products'
import { useLocalStorage } from './hooks/useLocalStorage'
import { getProducts, seedProducts, addSale } from './utils/db'
import { getCategories, seedCategories } from './utils/categories'
import Header from './components/Header'
import ProductGrid from './components/ProductGrid'
import Ticket from './components/Ticket'
import WeightModal from './components/WeightModal'
import PaymentModal from './components/PaymentModal'
import TicketPreview from './components/TicketPreview'
import SideMenu from './components/SideMenu'
import Products from './components/Products'
import Categories from './components/Categories'
import RamosComerciales from './components/RamosComerciales'
import TasaBcv from './features/TasaBcv/components/TasaBcv'
import BackupModal from './components/BackupModal'
import SalesReportModal from './components/SalesReportModal'
import SettingsModal from './components/SettingsModal'
import './App.css'

function App() {
  const [cart, setCart] = useLocalStorage('fruteria-cart', [])
  const [tasa, setTasa] = useLocalStorage('fruteria-tasa', 36.50)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentFilter, setCurrentFilter] = useState('todos')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [ramosOpen, setRamosOpen] = useState(false)
  const [tasaBcvOpen, setTasaBcvOpen] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const [salesReportOpen, setSalesReportOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [settings, setSettings] = useLocalStorage('fruteria-settings', {
    companyName: 'Frutería POS',
    bgColor: '#4a8c5e',
    textColor: '#ffffff',
  })
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  // Aplica los colores del theme al :root del documento
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--header-bg', settings.bgColor)
    root.style.setProperty('--header-text', settings.textColor)
  }, [settings])

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

  async function loadCategories() {
    try {
      setLoadingCategories(true)
      await seedCategories([
        { id: 'frutas', name: 'Frutas', icon: '🍊', order: 1, ramo: 'fruteria' },
        { id: 'verduras', name: 'Verduras', icon: '🥬', order: 2, ramo: 'fruteria' },
        { id: 'ofertas', name: 'Ofertas', icon: '🏷️', order: 3, ramo: 'fruteria' },
      ])
      const list = await getCategories()
      setCategories(
        list.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name))
      )
    } catch (error) {
      console.error('Error inicializando categorías:', error)
    } finally {
      setLoadingCategories(false)
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

  const editCartItem = (index, newQty) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, qty: newQty, totalUSD: newQty * item.price }
          : item
      )
    )
  }

  const clearCart = () => {
    if (cart.length === 0) return
    if (confirm('¿Vaciar el ticket?')) {
      setCart([])
    }
  }

  const completePayment = async (paymentData) => {
    const sale = {
      date: new Date().toISOString(),
      tasa,
      totalUSD: totals.totalUSD,
      totalBS: totals.totalBS,
      pagomovilRef: paymentData.pagomovilRef || '',
      pagomovilBanco: paymentData.pagomovilBanco || '',
      pagomovilMonto: paymentData.pagomovilMonto || 0,
      efectivoBS: paymentData.efectivoBS || 0,
      puntoCard: paymentData.puntoCard || '',
      puntoBanco: paymentData.puntoBanco || '',
      puntoMonto: paymentData.puntoMonto || 0,
      divisaUSD: paymentData.divisaUSD || 0,
      totalPagado: paymentData.totalPagado || 0,
      vuelto: paymentData.vuelto || 0,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        um: item.um,
        price: item.price,
        qty: item.qty,
        totalUSD: item.totalUSD,
      })),
    }

    try {
      const saleId = await addSale(sale)
      console.log('Venta guardada con id:', saleId, sale)
    } catch (error) {
      console.error('Error guardando la venta:', error)
    }

    setLastSale(sale)
    setPaymentOpen(false)
    setPreviewOpen(true)
    setCart([])
  }

  return (
    <div className="app">
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpen={() => setIsMenuOpen(true)}
        currentFilter={currentFilter}
        categories={categories}
        companyName={settings.companyName}
        onFilterChange={(filter) => {
          if (filter === 'productos') {
            setProductsOpen(true)
          } else if (filter === 'categorias') {
            setCategoriesOpen(true)
          } else if (filter === 'ramos') {
            setRamosOpen(true)
          } else if (filter === 'tasabcv') {
            setTasaBcvOpen(true)
          } else if (filter === 'backup') {
            setBackupOpen(true)
          } else if (filter === 'sales-report') {
            setSalesReportOpen(true)
          } else if (filter === 'config') {
            setSettingsOpen(true)
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuToggle={() => setIsMenuOpen(true)}
        cart={cart}
        totals={totals}
        onRemoveItem={removeItem}
        companyName={settings.companyName}
        onEditItem={editCartItem}
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
            categories={categories}
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
          tasa={tasa}
          onClose={() => setPaymentOpen(false)}
          onConfirm={completePayment}
        />
      )}

      {previewOpen && (
        <TicketPreview
          sale={lastSale}
          cart={cart}
          totals={totals}
          tasa={tasa}
          onClose={() => setPreviewOpen(false)}
          companyName={settings.companyName}
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

      {categoriesOpen && (
        <Categories
          onClose={() => {
            setCategoriesOpen(false)
            loadCategories()
          }}
        />
      )}

      {ramosOpen && (
        <RamosComerciales
          onClose={() => setRamosOpen(false)}
        />
      )}

      {tasaBcvOpen && (
        <TasaBcv
          onClose={() => setTasaBcvOpen(false)}
          onTasaChange={setTasa}
        />
      )}

      {backupOpen && (
        <BackupModal
          onClose={() => setBackupOpen(false)}
          onImportComplete={() => {
            loadProducts()
            loadCategories()
            window.location.reload()
          }}
        />
      )}

      {salesReportOpen && (
        <SalesReportModal
          onClose={() => setSalesReportOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={setSettings}
          onClose={() => setSettingsOpen(false)}
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

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
import SettingsModal from './components/SettingsModal'
import PinPrompt from './components/PinPrompt'
import { getLogs, LOG_TYPES } from './utils/logService'
import { estaDesbloqueado, crearSesion, bloquearSesion } from './utils/session'
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
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [settings, setSettings] = useLocalStorage('fruteria-settings', {
    companyName: 'Frutería POS',
    bgColor: '#4a8c5e',
    textColor: '#ffffff',
    ramoId: 'fruteria',
    pin: '',
    sessionHoras: 8,
    sessionMinutos: 0,
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pinPromptOpen, setPinPromptOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [sesionActiva, setSesionActiva] = useState(() => estaDesbloqueado())

  // Lee de localStorage cuándo fue la última vez que se marcaron leídas
  const [lastAlertReadAt, setLastAlertReadAt] = useState(
    () => localStorage.getItem('fruteria-alert-read-at') || null
  )

  // Carga la cantidad de logs tipo ALERT NO LEÍDOS (posteriores a lastAlertReadAt)
  async function refreshAlertCount() {
    try {
      const logs = await getLogs({ type: LOG_TYPES.ALERT })
      const readAt = localStorage.getItem('fruteria-alert-read-at')
      const unread = readAt
        ? logs.filter((l) => new Date(l.timestamp) > new Date(readAt)).length
        : logs.length
      setAlertCount(unread)
    } catch (e) {
      // silencio
    }
  }

  useEffect(() => {
    refreshAlertCount()
  }, [pinPromptOpen, lastAlertReadAt])

  const handleAlertBadgeClick = () => {
    if (settings.pin) {
      setPinPromptOpen(true)
    } else {
      setSettingsOpen(true)
    }
  }

  // Abre Configuración: con PIN pedido solo si no hay sesión activa
  const abrirConfiguracion = () => {
    if (settings.pin && !sesionActiva) {
      setPinPromptOpen(true)
    } else {
      setSettingsOpen(true)
    }
  }

  const handleLockNow = () => {
    bloquearSesion()
    setSesionActiva(false)
  }

  const handleAlertRead = () => {
    const now = new Date().toISOString()
    localStorage.setItem('fruteria-alert-read-at', now)
    setLastAlertReadAt(now)
    setAlertCount(0)
  }

  // El ramo activo siempre disponible sin consultar BD
  const ramoActivo = settings.ramoId || 'fruteria'

  useEffect(() => {
    loadProducts()
    loadCategories()
    refreshAlertCount()
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
          ramo: product.ramo || '',
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
        ramo: item.ramo || '',
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
        companyName={settings.companyName}
        onFilterChange={(filter) => {
          if (filter === 'config') {
            setIsMenuOpen(false)
            abrirConfiguracion()
          } else {
            setCurrentFilter(filter)
            setIsMenuOpen(false)
          }
        }}
        hasPin={!!settings.pin}
        onLockNow={handleLockNow}
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
        alertCount={alertCount}
        onAlertClick={handleAlertBadgeClick}
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

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={setSettings}
          onClose={() => setSettingsOpen(false)}
          onTasaChange={setTasa}
          ramoId={ramoActivo}
          onRefreshProducts={loadProducts}
          onRefreshCategories={loadCategories}
          onRefreshBackup={() => {
            loadProducts()
            loadCategories()
          }}
          onAlertRead={handleAlertRead}
        />
      )}

      {pinPromptOpen && (
        <PinPrompt
          pin={settings.pin}
          onSuccess={() => {
            crearSesion(settings.sessionHoras ?? 8, settings.sessionMinutos ?? 0)
            setSesionActiva(true)
            setPinPromptOpen(false)
            setSettingsOpen(true)
          }}
          onClose={() => setPinPromptOpen(false)}
        />
      )}
    </div>
  )
}

export default App

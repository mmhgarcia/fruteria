import { useState, useMemo, useEffect } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { getProducts, seedProducts, addSale, updateProduct } from './utils/db'
import { getCategories, getCategoriesByRamo, seedCategories, updateCategory } from './utils/categories'
import Header from './components/Header'
import ProductGrid from './components/ProductGrid'
import Ticket from './components/Ticket'
import WeightModal from './components/WeightModal'
import PaymentModal from './components/PaymentModal'
import TicketPreview from './components/TicketPreview'
import SideMenu from './components/SideMenu'
import SettingsModal from './components/SettingsModal'
import PinPrompt from './components/PinPrompt'
import RamoSetup from './components/RamoSetup'
import TasaBcv from './features/TasaBcv/components/TasaBcv'
import SalesReportModal from './components/SalesReportModal'
import LogsViewerModal from './components/LogsViewerModal'
import Categories from './components/Categories'
import Products from './components/Products'
import { getRamoPorId } from './data/ramos'
import { getLogs, addLog, LOG_TYPES } from './utils/logService'
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
    ramoId: '',
    pin: '',
    sessionHoras: 8,
    sessionMinutos: 0,
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pinPromptOpen, setPinPromptOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [sesionActiva, setSesionActiva] = useState(() => estaDesbloqueado())
  const [showTasa, setShowTasa] = useState(false)
  const [showSalesReport, setShowSalesReport] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showProducts, setShowProducts] = useState(false)

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
    if (settings.pin && !sesionActiva) {
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

  const handleRamoSeleccionado = async (ramo) => {
    try {
      await addLog(LOG_TYPES.INFO, 'Ramo comercial asignado', {
        ramoId: ramo.id,
        ramoName: ramo.name,
        timestamp: new Date().toISOString(),
      })
    } catch (e) {
      // silencio
    }
    setSettings((prev) => ({ ...prev, ramoId: ramo.id }))
    loadProducts(ramo.id)
    loadCategories(ramo.id)
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

  async function loadProducts(ramoIdOverride) {
    try {
      setLoadingProducts(true)
      const ramoId = ramoIdOverride || ramoActivo
      const ramo = getRamoPorId(ramoId)
      if (ramo && (ramoIdOverride || settings.ramoId)) {
        await seedProducts(ramo.products)
        const allP = await getProducts()
        const desconocidos = allP.filter((p) => !p.ramo || !getRamoPorId(p.ramo))
        for (const p of desconocidos) {
          await updateProduct({ ...p, ramo: ramo.id })
        }
      }
      const list = await getProducts()
      setProducts(
        list
          .filter((p) => p.ramo === ramoId)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    } catch (error) {
      console.error('Error inicializando productos:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  async function loadCategories(ramoIdOverride) {
    try {
      setLoadingCategories(true)
      const ramoId = ramoIdOverride || ramoActivo
      const ramo = getRamoPorId(ramoId)
      if (ramo && (ramoIdOverride || settings.ramoId)) {
        await seedCategories(ramo.categories.map((c) => ({ ...c, ramo: ramo.id })))
        const all = await getCategories()
        const desconocidas = all.filter((c) => !c.ramo || !getRamoPorId(c.ramo))
        for (const c of desconocidas) {
          await updateCategory({ ...c, ramo: ramo.id })
        }
      }
      const list = await getCategoriesByRamo(ramoId)
      setCategories(list)
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
      {!settings.ramoId && (
        <RamoSetup onSelect={handleRamoSeleccionado} />
      )}
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
        sesionActiva={sesionActiva}
        onLockNow={handleLockNow}
        onOpenTasa={() => setShowTasa(true)}
        onOpenSalesReport={() => setShowSalesReport(true)}
        onOpenLogs={() => setShowLogs(true)}
        onOpenCategories={() => setShowCategories(true)}
        onOpenProducts={() => setShowProducts(true)}
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
          onRefreshBackup={() => {
            loadProducts()
            loadCategories()
          }}
        />
      )}

      {showTasa && (
        <TasaBcv
          onClose={() => setShowTasa(false)}
          onTasaChange={setTasa}
        />
      )}

      {showSalesReport && (
        <SalesReportModal
          companyName={settings.companyName}
          onClose={() => setShowSalesReport(false)}
        />
      )}

      {showLogs && (
        <LogsViewerModal
          onClose={() => setShowLogs(false)}
          onAlertRead={handleAlertRead}
        />
      )}

      {showCategories && (
        <Categories
          ramoId={ramoActivo}
          onClose={() => {
            setShowCategories(false)
            loadCategories()
          }}
        />
      )}

      {showProducts && (
        <Products
          ramoId={ramoActivo}
          tasa={tasa}
          onClose={() => {
            setShowProducts(false)
            loadProducts()
          }}
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

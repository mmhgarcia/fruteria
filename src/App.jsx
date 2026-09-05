import { useState, useMemo, useEffect } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { getProducts, seedProducts, updateProduct } from './utils/db'
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
import BestSellingProductsModal from './components/BestSellingProductsModal'
import DailyTicketsModal from './components/DailyTicketsModal'
import InventoryValuationModal from './components/InventoryValuationModal'
import DashboardModal from './components/DashboardModal'
import LogsViewerModal from './components/LogsViewerModal'
import Categories from './components/Categories'
import Products from './components/Products'
import Inventory from './components/Inventory'
import StockAlertModal from './components/StockAlertModal'
import { registrarVentaAtomica } from './utils/inventory'
import { calcularTotales } from './utils/calcTotals'
import { computeStockAlerts } from './utils/stockAlerts'
import { getRamoPorId } from './data/ramos'
import { getLogs, addLog, LOG_TYPES } from './utils/logService'
import { estaDesbloqueado, crearSesion, bloquearSesion } from './utils/session'
import { runAutoBackupIfDue } from './utils/backupService'
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
  const [backupInProgress, setBackupInProgress] = useState(false)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [settings, setSettings] = useLocalStorage('fruteria-settings', {
    companyName: 'Frutería POS',
    companyAddress: '',
    companyContact: '',
    companyMobile: '',
    bgColor: '#4a8c5e',
    textColor: '#ffffff',
    ramoId: '',
    pin: '',
    sessionHoras: 8,
    sessionMinutos: 0,
    mostrarDashboardAlInicio: true,
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pinPromptOpen, setPinPromptOpen] = useState(false)
  const [pinPromptMode, setPinPromptMode] = useState('config')
  const [alertCount, setAlertCount] = useState(0)
  const [stockAlerts, setStockAlerts] = useState({ agotados: 0, pedidos: 0, sinDefinir: 0, total: 0, items: [] })
  const [sesionActiva, setSesionActiva] = useState(() => estaDesbloqueado())
  const [showTasa, setShowTasa] = useState(false)
  const [showSalesReport, setShowSalesReport] = useState(false)
  const [showBestSelling, setShowBestSelling] = useState(false)
  const [showDailyTickets, setShowDailyTickets] = useState(false)
  const [showInventoryValuation, setShowInventoryValuation] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showProducts, setShowProducts] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [alertaStockVenta, setAlertaStockVenta] = useState(null)
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)

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

  // Recalcula el resumen de stock (agotados/pedir) para el Header.
  // Usa el catálogo completo en IndexedDB (no filtrado por ramo) para que
  // las alertas sean visibles incluso si el filtro del grid difiere.
  async function refreshStockAlerts() {
    try {
      const all = await getProducts()
      const summary = computeStockAlerts(all, settings.ramoId || ramoActivo)
      setStockAlerts(summary)
    } catch (e) {
      // silencio
    }
  }

  useEffect(() => {
    refreshAlertCount()
  }, [pinPromptOpen, lastAlertReadAt])

  useEffect(() => {
    if (settings.pin && !sesionActiva) {
      setPinPromptMode('login')
      setPinPromptOpen(true)
    }
  }, [settings.pin, sesionActiva])

  const handleAlertBadgeClick = () => {
    if (settings.pin && !sesionActiva) {
      setPinPromptMode('config')
      setPinPromptOpen(true)
    } else {
      setSettingsOpen(true)
    }
  }

  // Abre Configuración: con PIN pedido solo si no hay sesión activa
  const abrirConfiguracion = () => {
    if (settings.pin && !sesionActiva) {
      setPinPromptMode('config')
      setPinPromptOpen(true)
    } else {
      setSettingsOpen(true)
    }
  }

  const handleLockNow = () => {
    bloquearSesion()
    setSesionActiva(false)
  }

  const handleToggleDashboardInicio = (value) => {
    setSettings((prev) => ({ ...prev, mostrarDashboardAlInicio: value }))
  }

  // Click en el badge de stock: abre Inventario (con PIN si corresponde).
  const handleStockBadgeClick = () => {
    if (settings.pin && !sesionActiva) {
      setPinPromptMode('config')
      setPinPromptOpen(true)
    } else {
      setShowInventory(true)
    }
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
    refreshStockAlerts()
  }

  // El ramo activo siempre disponible sin consultar BD
  const ramoActivo = settings.ramoId || 'fruteria'

  useEffect(() => {
    loadProducts()
    loadCategories()
    refreshAlertCount()
    refreshStockAlerts()
    // Backup automático (SPEC-001): si falta el respaldo del día previo, lo crea. Best-effort.
    runAutoBackupIfDue({
      onStart: () => setBackupInProgress(true),
    })
      .catch(() => {})
      .finally(() => setBackupInProgress(false))
    if ((!settings.pin || sesionActiva) && settings.mostrarDashboardAlInicio !== false) {
      setShowDashboard(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const totals = useMemo(() => calcularTotales(cart, tasa), [cart, tasa])

  const addToCart = (product, qty) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        const newQty = existing.qty + qty
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                qty: newQty,
                totalUSD: newQty * item.price,
                stock: product.stock ?? item.stock ?? null,
                stockMin: product.stockMin ?? item.stockMin ?? null,
              }
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
          stock: product.stock ?? null,
          stockMin: product.stockMin ?? null,
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
    if (paymentSubmitting) return
    setPaymentSubmitting(true)

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

    const itemsParaStock = cart.map((item) => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
    }))

    try {
      // Venta + descuento de stock en UNA transacción atómica.
      // Si algo falla, NADA se persiste y el carrito queda intacto.
      const { saleId, faltantes, alertas } = await registrarVentaAtomica({
        sale,
        items: itemsParaStock,
      })

      // Solo acá (post-oncomplete) tocamos el carrito y mostramos ticket.
      setLastSale({ ...sale, id: saleId })
      setCart([])
      setPaymentOpen(false)
      setPreviewOpen(true)

      // Refrescar productos en memoria (orden alfabético).
      const updatedProducts = (await getProducts())
        .filter((p) => p.ramo === ramoActivo)
        .sort((a, b) => a.name.localeCompare(b.name))
      setProducts(updatedProducts)
      await refreshStockAlerts()

      if (alertas.length > 0) {
        setAlertaStockVenta({ saleId, productos: alertas })
      }
      if (faltantes.length > 0) {
        console.warn('Items con stock insuficiente al cobrar:', faltantes)
      }

      // Log de alerta consolidado (best-effort, fuera de la tx).
      if (alertas.length > 0) {
        addLog(LOG_TYPES.ALERT, 'Stock por reponer tras venta', {
          saleId,
          productos: alertas.map((a) => ({
            id: a.id,
            name: a.name,
            estado: a.estado,
            stockNuevo: a.stockNuevo,
            stockAnterior: a.stockAnterior,
            stockMin: a.stockMin,
          })),
        }).catch(() => {})
      }
    } catch (error) {
      // La tx falló: carrito intacto, sin ticket, sin venta.
      console.error('Error guardando la venta:', error)
      alert(
        'No se pudo registrar la venta. Verifica el almacenamiento y reintenta.\n\n' +
        'El carrito se mantiene para que puedas cobrar de nuevo.'
      )
    } finally {
      setPaymentSubmitting(false)
    }
  }

  return (
    <div className="app">
      {backupInProgress && (
        <div className="backup-progress-bar" role="status" aria-live="polite">
          <span className="backup-progress-text">RESPALDO EN PROCESO...</span>
          <span className="backup-progress-track" aria-hidden="true">
            <span className="backup-progress-fill" />
          </span>
        </div>
      )}
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
        onOpenBestSelling={() => setShowBestSelling(true)}
        onOpenDailyTickets={() => setShowDailyTickets(true)}
        onOpenInventoryValuation={() => setShowInventoryValuation(true)}
        onOpenDashboard={() => setShowDashboard(true)}
        onOpenLogs={() => setShowLogs(true)}
        onOpenCategories={() => setShowCategories(true)}
        onOpenProducts={() => setShowProducts(true)}
        onOpenInventory={() => setShowInventory(true)}
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
        stockAlerts={stockAlerts}
        onStockBadgeClick={handleStockBadgeClick}
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
          maxQty={
            typeof selectedProduct.stock === 'number'
              ? Math.max(
                  0,
                  selectedProduct.stock -
                    cart.reduce((s, it) => (it.id === selectedProduct.id ? s + it.qty : s), 0)
                )
              : undefined
          }
        />
      )}

      {paymentOpen && (
        <PaymentModal
          totals={totals}
          tasa={tasa}
          onClose={() => setPaymentOpen(false)}
          onConfirm={completePayment}
          submitting={paymentSubmitting}
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

      {alertaStockVenta && (
        <StockAlertModal
          alerta={alertaStockVenta}
          onClose={() => setAlertaStockVenta(null)}
          onGoToInventory={() => {
            setAlertaStockVenta(null)
            setShowInventory(true)
          }}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={setSettings}
          onClose={() => setSettingsOpen(false)}
          onOpenTasa={() => {
            setSettingsOpen(false)
            setShowTasa(true)
          }}
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

      {showBestSelling && (
        <BestSellingProductsModal
          companyName={settings.companyName}
          onClose={() => setShowBestSelling(false)}
        />
      )}

      {showDailyTickets && (
        <DailyTicketsModal
          companyName={settings.companyName}
          tasa={tasa}
          onClose={() => setShowDailyTickets(false)}
        />
      )}

      {showInventoryValuation && (
        <InventoryValuationModal
          companyName={settings.companyName}
          ramoId={settings.ramoId}
          onClose={() => setShowInventoryValuation(false)}
        />
      )}

      {showDashboard && (
        <DashboardModal
          ramoId={settings.ramoId}
          companyName={settings.companyName}
          mostrarAlInicio={settings.mostrarDashboardAlInicio !== false}
          onToggleInicio={handleToggleDashboardInicio}
          onClose={() => setShowDashboard(false)}
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

      {showInventory && (
        <Inventory
          onClose={() => {
            setShowInventory(false)
            loadProducts()
            refreshStockAlerts()
          }}
          ramoId={settings.ramoId}
        />
      )}

      {pinPromptOpen && (
        <PinPrompt
          pin={settings.pin}
          mode={pinPromptMode}
          required={pinPromptMode === 'login'}
          onSuccess={() => {
            crearSesion(settings.sessionHoras ?? 8, settings.sessionMinutos ?? 0)
            setSesionActiva(true)
            setPinPromptOpen(false)
            if (pinPromptMode === 'config') {
              setSettingsOpen(true)
            }
          }}
          onClose={() => setPinPromptOpen(false)}
        />
      )}
    </div>
  )
}

export default App

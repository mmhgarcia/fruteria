import { useEffect, useRef, useState } from 'react'
import './SideMenu.css'

export default function SideMenu({ isOpen, onClose, onOpen, currentFilter, onFilterChange, companyName, hasPin, sesionActiva, onLockNow, onOpenTasa, onOpenSalesReport, onOpenBestSelling, onOpenDailyTickets, onOpenInventoryValuation, onOpenDashboard, onOpenLogs, onOpenCategories, onOpenProducts, onOpenInventory }) {
  const CONFIG_OPTION = { id: 'config', label: 'Configuración de Sistema', icon: '⚙️' }

  const [reportsOpen, setReportsOpen] = useState(false)
  const verAdmin = sesionActiva
  const menuRef = useRef(null)
  const edgeRef = useRef(null)
  const [dragX, setDragX] = useState(0)
  const [menuWidth, setMenuWidth] = useState(0)
  const startX = useRef(0)
  const isDragging = useRef(false)

  // Opciones de administración superiores (antes de Reportes)
  const ADMIN_TOP_OPTIONS = [
    { id: 'categorias', label: 'Categorías de Producto', icon: '📂', onClick: onOpenCategories },
    { id: 'productos', label: 'Catálogo de Productos', icon: '📦', onClick: onOpenProducts },
    { type: 'separator', id: 'sep0' },
    { id: 'inventario', label: 'Inventario', icon: '🛒', onClick: onOpenInventory },
  ]

  // Opciones de administración inferiores (después de Reportes)
  const ADMIN_BOTTOM_OPTIONS = [
    { id: 'tasa', label: 'Tasa BCV', icon: '💱', onClick: onOpenTasa },
    { type: 'separator', id: 'sep3' },
    { id: 'config', label: 'Configuración de Sistema', icon: '⚙️' },
    { id: 'logs', label: 'Visor de Logs', icon: '📋', onClick: onOpenLogs },
  ]

  const REPORT_OPTIONS = [
    { id: 'sales', label: 'Reporte de Ventas', icon: '📈', onClick: onOpenSalesReport },
    { id: 'best-selling', label: 'Productos Más Vendidos', icon: '🏆', onClick: onOpenBestSelling },
    { id: 'daily-tickets', label: 'Tickets del Día', icon: '🧾', onClick: onOpenDailyTickets },
    { id: 'inventory-valuation', label: 'Inventario Valorizado', icon: '💰', onClick: onOpenInventoryValuation },
  ]

  useEffect(() => {
    if (menuRef.current) {
      setMenuWidth(menuRef.current.offsetWidth)
    }
  }, [])

  const handleOptionClick = (id) => {
    if (id !== 'separator') {
      onFilterChange(id)
    }
    if (id !== 'separator') {
      onClose()
    }
  }

  const startDrag = (clientX) => {
    if (isOpen) return
    startX.current = clientX
    isDragging.current = true
    menuRef.current?.style.setProperty('transition', 'none')
  }

  const moveDrag = (clientX) => {
    if (!isDragging.current) return
    const delta = clientX - startX.current
    if (delta < 0) return
    setDragX(Math.min(delta, menuWidth))
  }

  const endDrag = () => {
    if (!isDragging.current) return
    isDragging.current = false
    menuRef.current?.style.removeProperty('transition')
    if (dragX > menuWidth * 0.4) {
      onOpen()
    }
    setDragX(0)
  }

  const onTouchStart = (e) => startDrag(e.touches[0].clientX)
  const onTouchMove = (e) => moveDrag(e.touches[0].clientX)
  const onTouchEnd = endDrag

  const translate = isOpen ? 0 : dragX - menuWidth

  return (
    <>
      <div
        ref={edgeRef}
        className="side-menu-edge"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      <div
        className={`side-menu-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      <aside
        ref={menuRef}
        className={`side-menu ${menuWidth === 0 ? 'hidden' : ''} ${!isOpen && dragX === 0 ? 'closed' : ''}`}
        style={{ transform: `translateX(${translate}px)` }}
      >
        <div className="side-menu-header">
          <span className="side-menu-title">{companyName || 'Frutería POS'}</span>
          <button className="side-menu-close" onClick={onClose} aria-label="Cerrar menú">
            ✕
          </button>
        </div>

        <nav className="side-menu-nav">
          {!verAdmin && (
            <button
              className={`side-menu-option ${currentFilter === CONFIG_OPTION.id ? 'active' : ''}`}
              onClick={() => handleOptionClick(CONFIG_OPTION.id)}
            >
              <span className="side-menu-icon">{CONFIG_OPTION.icon}</span>
              <span className="side-menu-label">{CONFIG_OPTION.label}</span>
            </button>
          )}
          {verAdmin && (
            <>
              {/* Dashboard */}
              <button
                className={`side-menu-option ${currentFilter === 'dashboard' ? 'active' : ''}`}
                onClick={() => { onClose(); onOpenDashboard(); }}
              >
                <span className="side-menu-icon">📊</span>
                <span className="side-menu-label">Dashboard</span>
              </button>

              <hr className="side-menu-separator" />

              {/* Categorías de producto y catálogo */}
              <button
                className={`side-menu-option ${currentFilter === 'categorias' ? 'active' : ''}`}
                onClick={() => { onClose(); onOpenCategories(); }}
              >
                <span className="side-menu-icon">📂</span>
                <span className="side-menu-label">Categorías de Producto</span>
              </button>

              <button
                className={`side-menu-option ${currentFilter === 'productos' ? 'active' : ''}`}
                onClick={() => { onClose(); onOpenProducts(); }}
              >
                <span className="side-menu-icon">📦</span>
                <span className="side-menu-label">Catálogo de Productos</span>
              </button>

              <hr className="side-menu-separator" />

              {/* Inventario */}
              <button
                className={`side-menu-option ${currentFilter === 'inventario' ? 'active' : ''}`}
                onClick={() => { onClose(); onOpenInventory(); }}
              >
                <span className="side-menu-icon">🛒</span>
                <span className="side-menu-label">Inventario</span>
              </button>

              <hr className="side-menu-separator" />

              {/* Acordeón de Reportes */}
              <div className="side-menu-accordion">
                <button
                  type="button"
                  className={`side-menu-option side-menu-accordion-trigger ${reportsOpen ? 'open' : ''}`}
                  onClick={() => setReportsOpen(!reportsOpen)}
                >
                  <span className="side-menu-icon">📊</span>
                  <span className="side-menu-label">REPORTES DEL SISTEMA</span>
                  <span className="side-menu-arrow">{reportsOpen ? '▼' : '▶'}</span>
                </button>

                {reportsOpen && (
                  <div className="side-menu-accordion-content">
                    {REPORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        className="side-menu-option side-menu-sub-option"
                        onClick={() => {
                          onClose()
                          option.onClick()
                        }}
                      >
                        <span className="side-menu-icon">{option.icon}</span>
                        <span className="side-menu-label">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <hr className="side-menu-separator" />

              {/* Tasa BCV */}
              <button
                className={`side-menu-option ${currentFilter === 'tasa' ? 'active' : ''}`}
                onClick={() => { onClose(); onOpenTasa(); }}
              >
                <span className="side-menu-icon">💱</span>
                <span className="side-menu-label">Tasa BCV</span>
              </button>

              <hr className="side-menu-separator" />

              {/* Configuración y Visor de logs */}
              <button
                className={`side-menu-option ${currentFilter === CONFIG_OPTION.id ? 'active' : ''}`}
                onClick={() => {
                  onClose()
                  handleOptionClick(CONFIG_OPTION.id)
                }}
              >
                <span className="side-menu-icon">{CONFIG_OPTION.icon}</span>
                <span className="side-menu-label">{CONFIG_OPTION.label}</span>
              </button>

              <button
                className={`side-menu-option ${currentFilter === 'logs' ? 'active' : ''}`}
                onClick={() => { onClose(); onOpenLogs(); }}
              >
                <span className="side-menu-icon">📋</span>
                <span className="side-menu-label">Visor de Logs</span>
              </button>
            </>
          )}
          {hasPin && (
            <>
              <hr className="side-menu-separator" />
              <button
                className="side-menu-option side-menu-lock"
                onClick={() => {
                  onLockNow()
                  onClose()
                }}
              >
                <span className="side-menu-icon">🔒</span>
                <span className="side-menu-label">Bloquear ahora</span>
              </button>
            </>
          )}
        </nav>

        <div className="side-menu-footer">
          <span>v1.0.0</span>
        </div>
      </aside>
    </>
  )
}

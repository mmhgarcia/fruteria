import { useEffect, useRef, useState } from 'react'
import './SideMenu.css'

const MENU_OPTIONS = [
  { id: 'todos', label: 'Todos los productos', icon: '🍎' },
  { id: 'frutas', label: 'Frutas', icon: '🍊' },
  { id: 'verduras', label: 'Verduras', icon: '🥬' },
  { id: 'ofertas', label: 'Ofertas', icon: '🏷️' },
  { id: 'separator', label: '', icon: '', type: 'separator' },
  { id: 'productos', label: 'Productos', icon: '📦' },
  { id: 'config', label: 'Configuración', icon: '⚙️' },
  { id: 'history', label: 'Historial', icon: '📜' },
]

export default function SideMenu({ isOpen, onClose, onOpen, currentFilter, onFilterChange }) {
  const menuRef = useRef(null)
  const edgeRef = useRef(null)
  const [dragX, setDragX] = useState(0)
  const startX = useRef(0)
  const isDragging = useRef(false)
  const menuWidth = useRef(0)

  useEffect(() => {
    if (menuRef.current) {
      menuWidth.current = menuRef.current.offsetWidth
    }
  }, [])

  const handleOptionClick = (id) => {
    if (id === 'config' || id === 'history') {
      alert(`Sección "${MENU_OPTIONS.find((o) => o.id === id)?.label}" próximamente`)
    } else if (id !== 'separator') {
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
    setDragX(Math.min(delta, menuWidth.current))
  }

  const endDrag = () => {
    if (!isDragging.current) return
    isDragging.current = false
    menuRef.current?.style.removeProperty('transition')
    if (dragX > menuWidth.current * 0.4) {
      onOpen()
    }
    setDragX(0)
  }

  const onTouchStart = (e) => startDrag(e.touches[0].clientX)
  const onTouchMove = (e) => moveDrag(e.touches[0].clientX)
  const onTouchEnd = endDrag

  const translate = isOpen ? 0 : -menuWidth.current + dragX

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
        className="side-menu"
        style={{ transform: `translateX(${translate}px)` }}
      >
        <div className="side-menu-header">
          <span className="side-menu-title">Frutería POS</span>
          <button className="side-menu-close" onClick={onClose} aria-label="Cerrar menú">
            ✕
          </button>
        </div>

        <nav className="side-menu-nav">
          {MENU_OPTIONS.map((option) =>
            option.type === 'separator' ? (
              <hr key={option.id} className="side-menu-separator" />
            ) : (
              <button
                key={option.id}
                className={`side-menu-option ${currentFilter === option.id ? 'active' : ''}`}
                onClick={() => handleOptionClick(option.id)}
              >
                <span className="side-menu-icon">{option.icon}</span>
                <span className="side-menu-label">{option.label}</span>
              </button>
            )
          )}
        </nav>

        <div className="side-menu-footer">
          <span>v1.0.0</span>
        </div>
      </aside>
    </>
  )
}

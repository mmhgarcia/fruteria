import { useEffect, useRef, useState } from 'react'
import './SideMenu.css'

export default function SideMenu({ isOpen, onClose, onOpen, currentFilter, onFilterChange, companyName }) {
  const MENU_OPTIONS = [
    { id: 'config', label: 'Configuración', icon: '⚙️' },
  ]
  const menuRef = useRef(null)
  const edgeRef = useRef(null)
  const [dragX, setDragX] = useState(0)
  const [menuWidth, setMenuWidth] = useState(0)
  const startX = useRef(0)
  const isDragging = useRef(false)

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

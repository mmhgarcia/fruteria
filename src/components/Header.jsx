import { useState } from 'react'
import CartModal from './CartModal'
import './Header.css'

function Header({
  cartCount,
  totalUSD,
  totalBS,
  tasa,
  searchTerm,
  onSearchChange,
  onMenuToggle,
  cart,
  totals,
  onRemoveItem,
  onEditItem,
  companyName,
}) {
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      <header className="header">
        <div className="header-top">
          <button
            className="menu-btn"
            onClick={onMenuToggle}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <span className="header-brand">{companyName || 'Frutería POS'}</span>
          <div className="header-tasa">Tasa: {tasa.toFixed(2)}</div>
        </div>
        <div className="header-bottom">
          <input
            type="text"
            className="search-box"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button
            className="cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label={`Abrir carrito con ${cartCount} items`}
          >
            <span className="cart-icon">🛒</span>
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      {cartOpen && (
        <CartModal
          cart={cart}
          totals={{ totalUSD, totalBS }}
          onClose={() => setCartOpen(false)}
          onRemoveItem={(idx) => {
            onRemoveItem(idx)
          }}
          onEditItem={onEditItem}
          tasa={tasa}
        />
      )}
    </>
  )
}

export default Header

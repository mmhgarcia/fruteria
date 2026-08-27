import './StockAlertModal.css'

function formatQty(n, um) {
  if (n == null) return '—'
  if (um === 'unidad') return String(Math.round(n))
  return Number(n).toFixed(1)
}

export default function StockAlertModal({ onClose, onGoToInventory, alerta }) {
  if (!alerta) return null

  const agotados = alerta.productos.filter((p) => p.estado === 'agotado')
  const pedidos = alerta.productos.filter((p) => p.estado === 'pedir')
  const total = alerta.productos.length

  return (
    <div className="modal-overlay stock-alert-overlay" onClick={onClose}>
      <div className="modal stock-alert-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="stock-alert-close"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
        >
          ✕
        </button>

        <div className="stock-alert-body">
          <header className="stock-alert-header">
            <span className="stock-alert-icon">📦</span>
            <div>
              <h2>Stock por reponer</h2>
              <span className="stock-alert-sub">
                {total} producto(s) afectado(s) en esta venta
              </span>
            </div>
          </header>

          {total === 0 ? (
            <div className="stock-alert-ok">✅ Todo en stock</div>
          ) : (
            <ul className="stock-alert-list">
              {alerta.productos.map((p) => (
                <li
                  key={`${p.id}-${p.estado}`}
                  className={`stock-alert-row stock-alert-row-${p.estado}`}
                >
                  <span className="stock-alert-item-icon">{p.icon || '🏷️'}</span>
                  <span className="stock-alert-item-name">{p.name}</span>
                  <span className="stock-alert-item-stock">
                    {p.estado === 'agotado'
                      ? `⛔ Agotado`
                      : `⚠️ Quedan ${formatQty(p.stockNuevo, p.um)}`}
                    {typeof p.stockMin === 'number' && p.stockMin > 0
                      ? ` / min ${formatQty(p.stockMin, p.um)}`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="stock-alert-footer">
          <button className="stock-alert-secondary" onClick={onClose}>
            Entendido
          </button>
          {total > 0 && (
            <button className="stock-alert-primary" onClick={onGoToInventory}>
              Ir al inventario
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

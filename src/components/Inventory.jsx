import './Inventory.css'

export default function Inventory({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="inventory-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>📊 Inventario</h2>
          <button className="inventory-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="inventory-body">
          <div className="inventory-placeholder">
            <div className="inventory-placeholder-icon">🚧</div>
            <h3>Módulo en construcción</h3>
            <p>
              El control de stock se implementará en próximas versiones.
              Ver <code>BrainStorm/19-modulo-inventario.md</code> para el diseño propuesto.
            </p>
            <ul className="inventory-roadmap">
              <li>Stock por producto + descuento automático al vender</li>
              <li>Entradas, ajustes y mermas</li>
              <li>Alertas de stock bajo</li>
              <li>Historial de movimientos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

import { CATALOGO_RAMOS } from '../data/ramos'
import './RamoSetup.css'

export default function RamoSetup({ onSelect }) {
  return (
    <div className="ramo-setup">
      <div className="ramo-setup-card">
        <h1 className="ramo-setup-title">Bienvenido</h1>
        <p className="ramo-setup-subtitle">
          Selecciona el ramo al que se dedica tu negocio. Esta configuración se realiza una sola vez.
        </p>
        <div className="ramo-setup-grid">
          {CATALOGO_RAMOS.map((ramo) => (
            <button
              key={ramo.id}
              className="ramo-setup-btn"
              onClick={() => onSelect(ramo)}
            >
              <span className="ramo-setup-icon">{ramo.icon}</span>
              <span className="ramo-setup-name">{ramo.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

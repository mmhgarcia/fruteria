import { useState, useEffect } from 'react'
import { getRamos } from '../utils/ramos'

/**
 * Componente reutilizable para seleccionar un Ramo Comercial.
 *
 * Props:
 *  - value: id del ramo seleccionado (controlado)
 *  - onChange(id): callback al cambiar selección
 *  - ramos (opcional): array de ramos precargado (si no se provee, lo carga solo)
 *  - label (opcional): texto a mostrar como label
 *  - className (opcional): clase adicional para el <select>
 *  - placeholder (opcional): texto del placeholder (default: "-- Seleccionar Ramo --")
 *  - showInactive (opcional): si true, muestra ramos inactivos como habilitados (default: solo como disabled)
 */
export default function RamoSelector({
  value,
  onChange,
  ramos: ramosProp,
  label,
  className = '',
  placeholder = '-- Seleccionar Ramo --',
  showInactive = false,
}) {
  const [ramosLocal, setRamosLocal] = useState([])

  useEffect(() => {
    if (ramosProp) {
      setRamosLocal(ramosProp)
    } else {
      getRamos()
        .then((list) =>
          setRamosLocal(
            list.sort((a, b) => a.name.localeCompare(b.name))
          )
        )
        .catch(console.error)
    }
  }, [ramosProp])

  const handleChange = (e) => {
    onChange(e.target.value)
  }

  const select = (
    <select
      className={className || 'ramo-selector-select'}
      value={value || ''}
      onChange={handleChange}
    >
      <option value="">{placeholder}</option>
      {ramosLocal.map((r) => (
        <option
          key={r.id}
          value={r.id}
          disabled={!showInactive && !r.activo}
        >
          {r.activo ? '' : '⛔ '}{r.name}
        </option>
      ))}
    </select>
  )

  if (label) {
    return (
      <label className="ramo-selector-label">
        <span>{label}</span>
        {select}
      </label>
    )
  }

  return select
}

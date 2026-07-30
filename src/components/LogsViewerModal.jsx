import { useState, useEffect, useMemo } from 'react'
import { getLogs, clearLogs, LOG_TYPES } from '../utils/logService'
import './LogsViewerModal.css'

const ALL_TYPES = Object.values(LOG_TYPES)

export default function LogsViewerModal({ onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null) // null = todos
  const [search, setSearch] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getLogs()
        setLogs(data)
      } catch (err) {
        console.error('Error cargando logs:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredLogs = useMemo(() => {
    let result = logs

    if (filter) {
      result = result.filter((log) => log.type === filter)
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase()
      result = result.filter((log) => {
        const inMessage = log.message?.toLowerCase().includes(term)
        const inDetails = JSON.stringify(log.details || {}).toLowerCase().includes(term)
        return inMessage || inDetails
      })
    }

    return result
  }, [logs, filter, search])

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    try {
      await clearLogs()
      setLogs([])
      setConfirmClear(false)
    } catch (err) {
      console.error('Error limpiando logs:', err)
    }
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    const date = d.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const time = d.toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    return `${date} ${time}`
  }

  const getTypeCounts = () => {
    const counts = {}
    for (const type of ALL_TYPES) {
      counts[type] = logs.filter((l) => l.type === type).length
    }
    return counts
  }

  const counts = getTypeCounts()

  return (
    <div className="logs-fullscreen">
      {/* Header */}
      <div className="logs-header">
        <span className="logs-header-icon">📋</span>
        <h2>Registro de Logs</h2>
        <span className="logs-header-count">{logs.length} registro{logs.length !== 1 ? 's' : ''}</span>
        <button className="logs-header-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>

      {/* Toolbar */}
      <div className="logs-toolbar">
        <input
          type="text"
          className="logs-search-input"
          placeholder="Buscar en mensaje o detalles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="logs-filter-group">
          <button
            className={`logs-filter-btn ${filter === null ? 'active' : ''}`}
            onClick={() => setFilter(null)}
          >
            Todos ({logs.length})
          </button>
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              className={`logs-filter-btn type-${type} ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(filter === type ? null : type)}
            >
              {type} ({counts[type]})
            </button>
          ))}
        </div>

        {logs.length > 0 && (
          <button
            className="logs-clear-btn"
            onClick={handleClear}
          >
            {confirmClear ? '¿Confirmar limpieza?' : 'Limpiar todo'}
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="logs-list">
        {loading ? (
          <div className="logs-empty">
            <span className="logs-empty-icon">⏳</span>
            <span>Cargando logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="logs-empty">
            <span className="logs-empty-icon">{search || filter ? '🔍' : '📭'}</span>
            <span>
              {search || filter
                ? 'No se encontraron registros con ese filtro.'
                : 'No hay logs registrados.'}
            </span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="log-entry">
              <div className="log-entry-top">
                <span className={`log-entry-badge ${log.type}`}>{log.type}</span>
                <span className="log-entry-message">{log.message}</span>
                <span className="log-entry-time">{formatTime(log.timestamp)}</span>
              </div>
              {log.details && Object.keys(log.details).length > 0 && (
                <div className="log-entry-details">
                  {JSON.stringify(log.details, null, 2)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

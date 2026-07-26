import { useEffect, useState } from 'react'
import { getTasas, addTasa, updateTasa, deleteTasa } from '../services/tasaService'

export function useTasas() {
  const [tasas, setTasas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')

  const loadTasas = async () => {
    try {
      setLoading(true)
      setError(null)
      const list = await getTasas()
      setTasas(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasas()
  }, [])

  const showMessage = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const create = async (data) => {
    try {
      await addTasa(data)
      await loadTasas()
      showMessage('✅ Nueva tasa agregada')
      return { success: true }
    } catch (err) {
      showMessage('❌ Error al guardar')
      return { success: false, error: err.message }
    }
  }

  const update = async (id, data) => {
    try {
      await updateTasa(id, data)
      await loadTasas()
      showMessage('✅ Registro actualizado')
      return { success: true }
    } catch (err) {
      showMessage('❌ Error al actualizar')
      return { success: false, error: err.message }
    }
  }

  const remove = async (id) => {
    if (!window.confirm('¿Deseas eliminar este registro de forma permanente?')) return { success: false }
    try {
      await deleteTasa(id)
      await loadTasas()
      showMessage('✅ Registro eliminado')
      return { success: true }
    } catch (err) {
      showMessage('❌ Error al eliminar')
      return { success: false, error: err.message }
    }
  }

  return {
    tasas,
    loading,
    error,
    message,
    loadTasas,
    create,
    update,
    remove,
  }
}

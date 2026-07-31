const SESSION_KEY = 'fruteria-auth-session'
const BLOCK_KEY = 'fruteria-pin-blocked-until'
const MAX_INTENTOS = 3
const BLOQUEO_MINUTOS = 5

/**
 * Crea una sesión de admin con la duración configurada (horas y minutos).
 * Sobrevive a recargas de la app.
 */
export function crearSesion(horas = 8, minutos = 0) {
  const duracionMs = ((horas * 60) + minutos) * 60 * 1000
  const session = {
    autorizado: true,
    expiresAt: new Date(Date.now() + duracionMs).toISOString(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

/**
 * Devuelve la sesión activa si existe y no expiró. Si expiró, la limpia.
 */
export function getSesion() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (!session.autorizado) return null
    if (new Date(session.expiresAt) <= new Date()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

/**
 * Indica si el admin está desbloqueado.
 */
export function estaDesbloqueado() {
  return getSesion() !== null
}

/**
 * Bloquea la sesión manualmente (botón "Bloquear ahora").
 */
export function bloquearSesion() {
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Tiempo restante de la sesión activa: { horas, minutos } o null.
 */
export function tiempoRestanteSesion() {
  const session = getSesion()
  if (!session) return null
  const ms = new Date(session.expiresAt) - new Date()
  return {
    horas: Math.floor(ms / (60 * 60 * 1000)),
    minutos: Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000)),
  }
}

// ── Bloqueo por fuerza bruta ──

/**
 * Fecha (ISO) hasta la cual el teclado del PIN está bloqueado, o null.
 */
export function getBloqueoFuerzaBruta() {
  const raw = localStorage.getItem(BLOCK_KEY)
  if (!raw) return null
  const until = new Date(raw)
  if (until <= new Date()) {
    localStorage.removeItem(BLOCK_KEY)
    return null
  }
  return until
}

/**
 * Activa el bloqueo por fuerza bruta (5 minutos, persistente).
 */
export function bloquearFuerzaBruta() {
  localStorage.setItem(
    BLOCK_KEY,
    new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000).toISOString()
  )
}

export const PIN_CONFIG = { MAX_INTENTOS, BLOQUEO_MINUTOS }

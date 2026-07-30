/**
 * Genera un hash SHA-256 hex del PIN usando Web Crypto API.
 * En environments donde SubtleCrypto no está disponible, fallback a un hash simple.
 */
export async function hashPin(pin) {
  if (!pin) return ''
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // Fallback para entornos sin Web Crypto (no debería ocurrir en navegadores modernos)
    let hash = 0
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

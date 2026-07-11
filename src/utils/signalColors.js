/**
 * Canonical signal colour helper — single source of truth for the whole app.
 *
 * Rules (per user spec):
 *   STRONG_BUY / STRONG BUY  → green  (solid)
 *   BUY                       → green  (tinted)
 *   HOLD / neutral / anything else → yellow
 *   SELL                      → red    (tinted)
 *   STRONG_SELL / STRONG SELL → red    (solid)
 */

const normalise = (signal) => String(signal || '').toUpperCase().replace(/_/g, ' ').trim()

/**
 * Returns Tailwind classes for a pill/badge element.
 * @param {string} signal  e.g. "BUY", "STRONG_BUY", "HOLD", "SELL", "STRONG_SELL"
 * @returns {string}
 */
export const signalBadgeClass = (signal) => {
  const s = normalise(signal)
  if (s === 'STRONG BUY')  return 'bg-green-500 text-white border border-green-600 font-bold'
  if (s === 'BUY')          return 'bg-green-500/20 text-green-400 border border-green-500/30 font-bold'
  if (s === 'STRONG SELL') return 'bg-red-500 text-white border border-red-600 font-bold'
  if (s === 'SELL')         return 'bg-red-500/20 text-red-400 border border-red-500/30 font-bold'
  return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold' // HOLD / neutral
}

/**
 * Returns a plain text colour class (for large score/label text).
 * @param {string} signal
 * @returns {string}
 */
export const signalTextClass = (signal) => {
  const s = normalise(signal)
  if (s === 'STRONG BUY' || s === 'BUY') return 'text-green-400'
  if (s === 'STRONG SELL' || s === 'SELL') return 'text-red-400'
  return 'text-yellow-400' // HOLD
}

/**
 * Returns a border + background pair for a card/panel container.
 * @param {string} signal
 * @returns {string}
 */
export const signalCardClass = (signal) => {
  const s = normalise(signal)
  if (s === 'STRONG BUY' || s === 'BUY') return 'border-green-500 bg-green-500/10'
  if (s === 'STRONG SELL' || s === 'SELL') return 'border-red-500 bg-red-500/10'
  return 'border-yellow-400 bg-yellow-400/10' // HOLD
}

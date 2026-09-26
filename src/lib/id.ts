/** Stable client-side id, with a fallback for browsers without `crypto.randomUUID`. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `txn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

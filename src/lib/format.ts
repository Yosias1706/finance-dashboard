import { format, isValid, parseISO } from 'date-fns'

/**
 * Shared display formatters. `Intl.NumberFormat` instances are expensive to
 * construct, so they are built once at module scope rather than per render.
 */

const wholeCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const exactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** Headline figures: `$8,679`. */
export function formatCurrency(value: number): string {
  return wholeCurrency.format(value)
}

/** Ledger rows and tooltips, where cents matter: `$8,679.31`. */
export function formatCurrencyExact(value: number): string {
  return exactCurrency.format(value)
}

/** Axis ticks, where space is scarce: `$8.7K`. */
export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value)
}

/** Renders an ISO calendar date as `Sep 23, 2026`, passing through unparseable input. */
export function formatTransactionDate(iso: string): string {
  const parsed = parseISO(iso)
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : iso
}

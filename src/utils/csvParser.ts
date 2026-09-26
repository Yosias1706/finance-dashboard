import Papa from 'papaparse'
import { format, isValid, parse, parseISO } from 'date-fns'
import type { Transaction, TransactionType } from '@/types/finance'
import { createId } from '@/lib/id'
import { autoCategorize, INCOME_CATEGORY } from '@/utils/categorizer'

type CsvRow = Record<string, string | undefined>

/** Date layouts we accept from exported bank statements, most common first. */
const DATE_FORMATS = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'M/d/yyyy',
  'MM-dd-yyyy',
  'yyyy/MM/dd',
  'M/d/yy',
  'MMM d, yyyy',
  'MMMM d, yyyy',
  'd MMM yyyy',
  'dd.MM.yyyy',
] as const


/** Case/spacing-insensitive header lookup, so `DATE`, `Date ` and `date` all work. */
function readField(row: CsvRow, ...names: string[]): string {
  for (const name of names) {
    const target = name.toLowerCase()
    for (const [key, value] of Object.entries(row)) {
      if (key.trim().toLowerCase() === target && value != null && value.trim() !== '') {
        return value.trim()
      }
    }
  }
  return ''
}

/** Normalizes any supported date layout into an ISO calendar date, `yyyy-MM-dd`. */
export function normalizeDate(raw: string, reference: Date = new Date()): string | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null

  const iso = parseISO(trimmed)
  if (isValid(iso)) return format(iso, 'yyyy-MM-dd')

  for (const pattern of DATE_FORMATS) {
    const parsed = parse(trimmed, pattern, reference)
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd')
  }

  return null
}

/**
 * Parses an amount cell into a signed number.
 * Handles `$1,234.56`, `(45.00)` for negatives, and trailing `USD` suffixes.
 */
export function parseAmount(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null

  const isParenthesized = /^\(.*\)$/.test(trimmed)
  const hasMinus = trimmed.includes('-')
  const numeric = Number.parseFloat(trimmed.replace(/[^0-9.]/g, ''))

  if (!Number.isFinite(numeric)) return null

  return isParenthesized || hasMinus ? -numeric : numeric
}

function resolveType(signedAmount: number, category: string): TransactionType {
  if (category === INCOME_CATEGORY) return 'income'
  return signedAmount < 0 ? 'expense' : 'income'
}

function toTransaction(row: CsvRow): Transaction | null {
  const description = readField(row, 'description', 'name', 'memo', 'details')
  const date = normalizeDate(readField(row, 'date', 'transaction date', 'posted date'))
  const signedAmount = parseAmount(readField(row, 'amount', 'value', 'debit'))

  if (date === null || signedAmount === null || description === '') return null

  const explicitCategory = readField(row, 'category')
  const category = explicitCategory !== '' ? explicitCategory : autoCategorize(description)

  return {
    id: createId(),
    date,
    description,
    amount: Math.abs(signedAmount),
    category,
    type: resolveType(signedAmount, category),
  }
}

/**
 * Reads a bank-statement CSV (`Date`, `Description`, `Amount`) and returns clean,
 * auto-categorized transactions sorted newest first. Unparseable rows are skipped.
 */
export function parseCSV(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const transactions = results.data
          .map(toTransaction)
          .filter((transaction): transaction is Transaction => transaction !== null)

        if (transactions.length === 0) {
          reject(
            new Error(
              'No valid rows found. The CSV needs Date, Description and Amount columns.',
            ),
          )
          return
        }

        transactions.sort((a, b) => b.date.localeCompare(a.date))
        resolve(transactions)
      },
      error: (error: Error) => {
        reject(new Error(`Could not read "${file.name}": ${error.message}`))
      },
    })
  })
}

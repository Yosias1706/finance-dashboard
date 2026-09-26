/**
 * Core domain types for the Personal Finance & Expense Analytics dashboard.
 * Every monetary value is stored as a positive number; direction is carried
 * by `Transaction.type` so charts never have to reason about signs.
 */

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  /** Stable client-side identifier (UUID for imported/manual rows). */
  id: string
  /** ISO calendar date, `yyyy-MM-dd`. */
  date: string
  description: string
  /** Always positive. Combine with `type` to get the signed value. */
  amount: number
  category: string
  type: TransactionType
}

/** A transaction before it has been assigned an id (manual entry / import). */
export type TransactionInput = Omit<Transaction, 'id'>

export interface CategoryBudget {
  category: string
  allocated: number
}

/** One slice of the Recharts Pie/Donut chart. */
export interface CategoryDatum {
  /** Category label — Recharts uses `name` as the default legend/tooltip key. */
  name: string
  /** Total spent in this category. */
  value: number
  /** Share of total expenses, 0–100. */
  percentage: number
  transactionCount: number
}

/** One bar group of the Recharts monthly Bar chart. */
export interface MonthlyTrend {
  /** Sort key, `yyyy-MM`. */
  monthKey: string
  /** Display label, e.g. `Sep 2026`. */
  month: string
  income: number
  expenses: number
  net: number
}

export interface AnalyticsSummary {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  /** Percentage of income kept, 0–100. Zero when there is no income. */
  savingsRate: number
  categoryBreakdown: CategoryDatum[]
  monthlyTrends: MonthlyTrend[]
}

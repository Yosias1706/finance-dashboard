import { useMemo } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import type { AnalyticsSummary, CategoryDatum, MonthlyTrend, Transaction } from '@/types/finance'
import { useFinanceStore } from '@/store/useFinanceStore'

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

interface MonthBucket {
  income: number
  expenses: number
}

function buildCategoryBreakdown(
  transactions: Transaction[],
  totalExpenses: number,
): CategoryDatum[] {
  const totals = new Map<string, { value: number; transactionCount: number }>()

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue
    const current = totals.get(transaction.category) ?? { value: 0, transactionCount: 0 }
    totals.set(transaction.category, {
      value: current.value + transaction.amount,
      transactionCount: current.transactionCount + 1,
    })
  }

  return Array.from(totals, ([name, { value, transactionCount }]) => ({
    name,
    value: round2(value),
    percentage: totalExpenses > 0 ? round2((value / totalExpenses) * 100) : 0,
    transactionCount,
  })).sort((a, b) => b.value - a.value)
}

function buildMonthlyTrends(transactions: Transaction[]): MonthlyTrend[] {
  const buckets = new Map<string, MonthBucket>()
  const labels = new Map<string, string>()

  for (const transaction of transactions) {
    const parsed = parseISO(transaction.date)
    if (!isValid(parsed)) continue

    const monthKey = format(parsed, 'yyyy-MM')
    labels.set(monthKey, format(parsed, 'MMM yyyy'))

    const bucket = buckets.get(monthKey) ?? { income: 0, expenses: 0 }
    if (transaction.type === 'income') {
      bucket.income += transaction.amount
    } else {
      bucket.expenses += transaction.amount
    }
    buckets.set(monthKey, bucket)
  }

  return Array.from(buckets, ([monthKey, bucket]) => ({
    monthKey,
    month: labels.get(monthKey) ?? monthKey,
    income: round2(bucket.income),
    expenses: round2(bucket.expenses),
    net: round2(bucket.income - bucket.expenses),
  })).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

/**
 * Derives every dashboard metric from the persisted transaction list.
 * All figures are recomputed only when `transactions` changes.
 */
export function useAnalytics(): AnalyticsSummary {
  const transactions = useFinanceStore((state) => state.transactions)

  return useMemo<AnalyticsSummary>(() => {
    let incomeTotal = 0
    let expenseTotal = 0

    for (const transaction of transactions) {
      if (transaction.type === 'income') {
        incomeTotal += transaction.amount
      } else {
        expenseTotal += transaction.amount
      }
    }

    const totalIncome = round2(incomeTotal)
    const totalExpenses = round2(expenseTotal)
    const netSavings = round2(incomeTotal - expenseTotal)

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate: incomeTotal > 0 ? round2((netSavings / incomeTotal) * 100) : 0,
      categoryBreakdown: buildCategoryBreakdown(transactions, expenseTotal),
      monthlyTrends: buildMonthlyTrends(transactions),
    }
  }, [transactions])
}

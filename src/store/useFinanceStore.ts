import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { format, getDaysInMonth, setDate, startOfMonth, subMonths } from 'date-fns'
import type { Transaction, TransactionInput } from '@/types/finance'
import { createId } from '@/lib/id'
import { autoCategorize, INCOME_CATEGORY } from '@/utils/categorizer'

interface FinanceState {
  transactions: Transaction[]
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: TransactionInput) => void
  deleteTransaction: (id: string) => void
  clearTransactions: () => void
  loadSampleData: () => void
}


function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.date.localeCompare(a.date))
}

interface SampleSeed {
  /** Day of month; clamped to the month's length. */
  day: number
  description: string
  /** Signed: negative is money out. */
  amount: number
}

/** Fixed costs and paychecks that repeat every month. */
const RECURRING_SEEDS: readonly SampleSeed[] = [
  { day: 1, description: 'Oakwood Apartments Rent Payment', amount: -1850 },
  { day: 2, description: 'Ridgeline Software Payroll Deposit', amount: 3280.44 },
  { day: 4, description: 'PG&E Electric Bill', amount: -128.4 },
  { day: 6, description: 'Xfinity Internet', amount: -79.99 },
  { day: 9, description: 'Netflix Subscription', amount: -22.99 },
  { day: 11, description: 'Spotify Premium', amount: -11.99 },
  { day: 14, description: 'Equinox Gym Membership', amount: -68 },
  { day: 16, description: 'Ridgeline Software Payroll Deposit', amount: 3280.44 },
  { day: 18, description: 'Verizon Wireless Phone Bill', amount: -95.32 },
  { day: 21, description: 'Whole Foods Market', amount: -142.87 },
]

/** Discretionary spending, indexed by how many months back the month is. */
const VARIABLE_SEEDS: readonly (readonly SampleSeed[])[] = [
  [
    { day: 3, description: 'Starbucks Coffee', amount: -6.75 },
    { day: 8, description: 'Uber Ride Downtown', amount: -18.4 },
    { day: 12, description: 'Amazon Order - Desk Lamp', amount: -54.2 },
    { day: 15, description: 'Chipotle Mexican Grill', amount: -14.85 },
    { day: 19, description: 'Shell Gas Station', amount: -48.6 },
    { day: 23, description: 'Trader Joe’s Groceries', amount: -78.31 },
  ],
  [
    { day: 5, description: 'Sweetgreen Lunch', amount: -16.2 },
    { day: 10, description: 'Delta Airlines Flight to Austin', amount: -312.4 },
    { day: 13, description: 'Lyft Airport Transfer', amount: -32.15 },
    { day: 17, description: 'Airbnb Austin Stay', amount: -240 },
    { day: 24, description: 'DoorDash Dinner Order', amount: -28.9 },
    { day: 27, description: 'Freelance Invoice Payment - Beacon Studio', amount: 650 },
  ],
  [
    { day: 7, description: 'Target Household Supplies', amount: -97.43 },
    { day: 13, description: 'CVS Pharmacy', amount: -23.18 },
    { day: 20, description: 'Best Buy Monitor', amount: -289.99 },
    { day: 23, description: 'Ticketmaster Concert Tickets', amount: -145 },
    { day: 26, description: 'Safeway Groceries', amount: -73.55 },
    { day: 28, description: 'Dividend Payment - Brokerage', amount: 42.18 },
  ],
]

function seedToTransaction(
  seed: SampleSeed,
  monthStart: Date,
  monthsAgo: number,
  index: number,
): Transaction {
  const date = setDate(monthStart, Math.min(seed.day, getDaysInMonth(monthStart)))
  const category = autoCategorize(seed.description)

  return {
    id: `sample-${monthsAgo}-${index}`,
    date: format(date, 'yyyy-MM-dd'),
    description: seed.description,
    amount: Math.abs(seed.amount),
    category,
    type: seed.amount < 0 && category !== INCOME_CATEGORY ? 'expense' : 'income',
  }
}

/**
 * Builds ~30 transactions spread across the current month and the two before it.
 * Dates in the future are dropped so the current month reads like a real
 * statement in progress.
 */
function buildSampleTransactions(): Transaction[] {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const currentMonth = startOfMonth(now)
  const transactions: Transaction[] = []

  for (let monthsAgo = 0; monthsAgo < 3; monthsAgo += 1) {
    const monthStart = subMonths(currentMonth, monthsAgo)
    const seeds = [...RECURRING_SEEDS, ...(VARIABLE_SEEDS[monthsAgo] ?? [])]

    seeds.forEach((seed, index) => {
      const transaction = seedToTransaction(seed, monthStart, monthsAgo, index)
      if (transaction.date <= today) transactions.push(transaction)
    })
  }

  return sortByDateDesc(transactions)
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      transactions: [],

      setTransactions: (transactions) => set({ transactions: sortByDateDesc(transactions) }),

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: sortByDateDesc([{ ...transaction, id: createId() }, ...state.transactions]),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        })),

      clearTransactions: () => set({ transactions: [] }),

      loadSampleData: () => set({ transactions: buildSampleTransactions() }),
    }),
    {
      name: 'finance-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

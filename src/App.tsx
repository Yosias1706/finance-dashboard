import { format } from 'date-fns'
import { RotateCcw, Wallet } from 'lucide-react'
import { AnalyticsOverview } from '@/components/AnalyticsOverview'
import { CSVUploader } from '@/components/CSVUploader'
import { TransactionTable } from '@/components/TransactionTable'
import { Button } from '@/components/ui/button'
import { useFinanceStore } from '@/store/useFinanceStore'

function App() {
  const hasTransactions = useFinanceStore((state) => state.transactions.length > 0)
  const clearTransactions = useFinanceStore((state) => state.clearTransactions)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
              aria-hidden
            >
              <Wallet className="size-4.5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold sm:text-base">Finance Dashboard</h1>
              <p className="truncate text-xs text-muted-foreground">
                Everything stays in this browser · {format(new Date(), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {hasTransactions && (
            <Button variant="ghost" size="sm" onClick={clearTransactions}>
              <RotateCcw aria-hidden />
              <span className="hidden sm:inline">Reset data</span>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <CSVUploader />
        <AnalyticsOverview />
        <TransactionTable />
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted-foreground sm:px-6 lg:px-8">
        Transactions are parsed locally and persisted to localStorage — nothing is uploaded.
      </footer>
    </div>
  )
}

export default App

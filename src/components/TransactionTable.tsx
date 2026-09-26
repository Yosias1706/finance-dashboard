import { useMemo, useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFinanceStore } from '@/store/useFinanceStore'

type SortKey = 'date' | 'amount'
type SortDirection = 'asc' | 'desc'

const ALL_CATEGORIES = '__all__'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatDate(iso: string): string {
  const parsed = parseISO(iso)
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : iso
}

export function TransactionTable() {
  const transactions = useFinanceStore((state) => state.transactions)
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>(ALL_CATEGORIES)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const categories = useMemo(
    () => Array.from(new Set(transactions.map((item) => item.category))).sort(),
    [transactions],
  )

  /** Base UI renders the raw value in the trigger unless it is given the labels. */
  const categoryItems = useMemo(
    () => [
      { value: ALL_CATEGORIES, label: 'All categories' },
      ...categories.map((name) => ({ value: name, label: name })),
    ],
    [categories],
  )

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()

    const filtered = transactions.filter((item) => {
      const matchesCategory = category === ALL_CATEGORIES || item.category === category
      const matchesSearch =
        needle === '' ||
        item.description.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle)

      return matchesCategory && matchesSearch
    })

    const direction = sortDirection === 'asc' ? 1 : -1

    return filtered.sort((a, b) =>
      sortKey === 'date'
        ? direction * a.date.localeCompare(b.date)
        : direction * (a.amount - b.amount),
    )
  }, [transactions, search, category, sortKey, sortDirection])

  /** Re-clicking the active column flips direction; a new column starts descending. */
  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('desc')
  }

  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden />
    return sortDirection === 'asc' ? (
      <ArrowUp className="size-3.5" aria-hidden />
    ) : (
      <ArrowDown className="size-3.5" aria-hidden />
    )
  }

  const ariaSort = (key: SortKey): 'ascending' | 'descending' | 'none' => {
    if (key !== sortKey) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          {visible.length === transactions.length
            ? `${transactions.length} transactions`
            : `${visible.length} of ${transactions.length} transactions`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search description or category"
              aria-label="Search transactions"
              className="pl-8"
            />
          </div>

          <Select
            items={categoryItems}
            value={category}
            onValueChange={(value: string | null) => setCategory(value ?? ALL_CATEGORIES)}
          >
            <SelectTrigger className="w-full sm:w-56" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {categories.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead aria-sort={ariaSort('date')}>
                <Button
                  variant="ghost"
                  size="xs"
                  className="-ml-2"
                  onClick={() => toggleSort('date')}
                >
                  Date
                  {sortIcon('date')}
                </Button>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-right" aria-sort={ariaSort('amount')}>
                <Button
                  variant="ghost"
                  size="xs"
                  className="-mr-2 ml-auto"
                  onClick={() => toggleSort('amount')}
                >
                  Amount
                  {sortIcon('amount')}
                </Button>
              </TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {transactions.length === 0
                    ? 'No transactions yet — import a CSV or load the sample data.'
                    : 'No transactions match these filters.'}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate font-medium text-foreground">
                    {transaction.description}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {/* The sign carries income vs. expense, so it never rests on colour. */}
                    {transaction.type === 'income' ? '+' : '−'}
                    {currency.format(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${transaction.description}`}
                      onClick={() => deleteTransaction(transaction.id)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

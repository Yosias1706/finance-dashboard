import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { ArrowDownRight, ArrowUpRight, PieChart as PieIcon, PiggyBank } from 'lucide-react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCompactCurrency, formatCurrency, formatCurrencyExact } from '@/lib/format'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { CategoryDatum } from '@/types/finance'

/**
 * Categorical slots in fixed order. A category keeps its hue no matter how the
 * list is filtered, and the ring never cycles: eight is the ceiling, because a
 * ninth hue cannot be told apart from an existing slot under colour-vision
 * deficiency. Slot order is the safety mechanism — do not reshuffle it.
 */
const SERIES = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
  'var(--series-7)',
  'var(--series-8)',
] as const

const MAX_SLICES = SERIES.length

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function MetricCard({
  title,
  value,
  detail,
  icon,
  swatch,
}: {
  title: string
  value: string
  detail: string
  icon: React.ReactNode
  swatch?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {swatch !== undefined && (
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: swatch }}
              aria-hidden
            />
          )}
          {title}
        </CardTitle>
        <CardAction className="text-muted-foreground">{icon}</CardAction>
      </CardHeader>
      <CardContent>
        <p className="truncate text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

/** Recharts injects these at render time, so every field is optional at the call site. */
type ChartTooltipProps = Partial<TooltipContentProps<number, string>>

function TrendTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active !== true || payload === undefined || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">{String(label)}</p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-3">
            <span
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto tabular-nums text-popover-foreground">
              {formatCurrencyExact(Number(entry.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CategoryTooltip({ active, payload }: ChartTooltipProps) {
  const entry = payload?.[0]
  if (active !== true || entry === undefined) return null

  const datum = entry.payload as CategoryDatum

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{datum.name}</p>
      <p className="mt-1 tabular-nums text-muted-foreground">
        {formatCurrencyExact(datum.value)} · {datum.percentage}% of spending
      </p>
    </div>
  )
}

function EmptyPlot({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function AnalyticsOverview() {
  const { totalIncome, totalExpenses, netSavings, savingsRate, categoryBreakdown, monthlyTrends } =
    useAnalytics()

  /**
   * The ring shows the seven largest categories plus a rolled-up "Other". The
   * folded categories are still listed in full below, so the cap limits colours,
   * not information.
   */
  const { slices, folded } = useMemo(() => {
    if (categoryBreakdown.length <= MAX_SLICES) {
      return { slices: categoryBreakdown, folded: [] as CategoryDatum[] }
    }

    const head = categoryBreakdown.slice(0, MAX_SLICES - 1)
    const tail = categoryBreakdown.slice(MAX_SLICES - 1)

    const other: CategoryDatum = {
      name: `Other (${tail.length} categories)`,
      value: round2(tail.reduce((total, datum) => total + datum.value, 0)),
      percentage: round2(tail.reduce((total, datum) => total + datum.percentage, 0)),
      transactionCount: tail.reduce((total, datum) => total + datum.transactionCount, 0),
    }

    return { slices: [...head, other], folded: tail }
  }, [categoryBreakdown])

  const topCategory = categoryBreakdown[0]
  const monthLabel = monthlyTrends.length === 1 ? '1 month' : `${monthlyTrends.length} months`

  return (
    <section className="flex flex-col gap-4" aria-label="Analytics overview">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total income"
          value={formatCurrency(totalIncome)}
          detail={`Money in across ${monthLabel}`}
          icon={<ArrowUpRight className="size-4" aria-hidden />}
          swatch="var(--series-income)"
        />
        <MetricCard
          title="Total expenses"
          value={formatCurrency(totalExpenses)}
          detail={`Money out across ${monthLabel}`}
          icon={<ArrowDownRight className="size-4" aria-hidden />}
          swatch="var(--series-expense)"
        />
        <MetricCard
          title="Savings rate"
          value={`${savingsRate.toFixed(1)}%`}
          detail={`${formatCurrency(netSavings)} net ${netSavings < 0 ? 'shortfall' : 'saved'}`}
          icon={<PiggyBank className="size-4" aria-hidden />}
        />
        <MetricCard
          title="Top category"
          value={topCategory?.name ?? '—'}
          detail={
            topCategory === undefined
              ? 'No spending recorded yet'
              : `${formatCurrency(topCategory.value)} · ${topCategory.percentage}% of spending`
          }
          icon={<PieIcon className="size-4" aria-hidden />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
            <CardDescription>
              Share of {formatCurrency(totalExpenses)} in expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slices.length === 0 ? (
              <EmptyPlot message="Import transactions to see your category split." />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="relative h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={slices}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="64%"
                        outerRadius="92%"
                        paddingAngle={2}
                        stroke="var(--card)"
                        strokeWidth={2}
                        isAnimationActive={false}
                      >
                        {slices.map((slice, index) => (
                          <Cell key={slice.name} fill={SERIES[index]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CategoryTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-muted-foreground">Spent</span>
                    <span className="text-xl font-semibold tabular-nums text-foreground">
                      {formatCurrency(totalExpenses)}
                    </span>
                  </div>
                </div>

                {/* Direct labels double as the legend, so identity is never colour-alone. */}
                <ul className="flex flex-col gap-1.5">
                  {slices.map((slice, index) => (
                    <li key={slice.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: SERIES[index] }}
                        aria-hidden
                      />
                      <span className="truncate text-foreground">{slice.name}</span>
                      <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                        {formatCurrency(slice.value)} · {slice.percentage}%
                      </span>
                    </li>
                  ))}
                </ul>

                {folded.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer list-none text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                      Break down the {folded.length} categories inside “Other”
                    </summary>
                    <ul className="mt-2 flex flex-col gap-1 border-l border-border pl-3">
                      {folded.map((item) => (
                        <li key={item.name} className="flex items-center gap-2 text-xs">
                          <span className="truncate text-muted-foreground">{item.name}</span>
                          <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                            {formatCurrency(item.value)} · {item.percentage}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Income vs. expenses</CardTitle>
            <CardDescription>Monthly totals</CardDescription>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-[3px]"
                  style={{ backgroundColor: 'var(--series-income)' }}
                  aria-hidden
                />
                Income
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-[3px]"
                  style={{ backgroundColor: 'var(--series-expense)' }}
                  aria-hidden
                />
                Expenses
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {monthlyTrends.length === 0 ? (
              <EmptyPlot message="Import transactions to see your monthly trend." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyTrends}
                    barGap={2}
                    margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    />
                    <YAxis
                      width={64}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      tickFormatter={formatCompactCurrency}
                    />
                    <Tooltip
                      content={<TrendTooltip />}
                      cursor={{ fill: 'var(--muted)', fillOpacity: 0.5 }}
                    />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="var(--series-income)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="var(--series-expense)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

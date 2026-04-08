import { useMemo } from 'react'
import { useBudgetStore } from '@/hooks/useBudgetStore'
import type { CutoffDefinition, ExpenseCategory, ExpenseEntry } from '@/types/budget'

type DateRange = {
  start: Date
  end: Date
}

const categoryLabels: Record<ExpenseCategory, string> = {
  food: 'Food',
  fare: 'Fare',
  house: 'House',
  bills: 'Bills',
  load: 'Load',
  shopping: 'Shopping',
  other: 'Other',
}

const categoryColors: Record<ExpenseCategory, string> = {
  food: 'bg-amber-500',
  fare: 'bg-emerald-500',
  house: 'bg-sky-500',
  bills: 'bg-rose-500',
  load: 'bg-violet-500',
  shopping: 'bg-fuchsia-500',
  other: 'bg-stone-500',
}

const toCurrency = (value: number) => `PHP ${value.toLocaleString()}`

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

const getLastDayOfMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate()

const shiftDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const toRangeLabel = (range: DateRange) =>
  `${range.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${range.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`

const getExpensesForRange = (expenses: ExpenseEntry[], range: DateRange) =>
  expenses.filter((expense) => {
    const createdAt = new Date(expense.createdAt)
    return createdAt >= range.start && createdAt <= range.end
  })

const getExpensesForCutoffAssignment = (
  expenses: ExpenseEntry[],
  cutoffId?: string,
) => expenses.filter((expense) => expense.cutoffId === cutoffId)

const sumExpenseAmounts = (expenses: ExpenseEntry[]) =>
  expenses.reduce((sum, expense) => sum + expense.amount, 0)

const getBars = (currentTotal: number, previousTotal: number) => {
  const max = Math.max(currentTotal, previousTotal, 1)

  return {
    current: Math.max((currentTotal / max) * 100, 8),
    previous: Math.max((previousTotal / max) * 100, 8),
  }
}

const getCategoryBreakdown = (expenses: ExpenseEntry[]) =>
  Object.entries(
    expenses.reduce<Record<ExpenseCategory, number>>((totals, expense) => {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount
      return totals
    }, {} as Record<ExpenseCategory, number>),
  )
    .map(([category, amount]) => ({
      category: category as ExpenseCategory,
      label: categoryLabels[category as ExpenseCategory],
      amount,
    }))
    .sort((left, right) => right.amount - left.amount)

const clampDayToMonth = (year: number, month: number, day: number) =>
  Math.min(day, getLastDayOfMonth(year, month))

const getCutoffRangeForDate = (
  date: Date,
  cutoff: CutoffDefinition,
): DateRange => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()

  if (cutoff.startDay <= cutoff.endDay) {
    const anchoredMonth = day < cutoff.startDay ? month - 1 : month
    const startDay = clampDayToMonth(year, anchoredMonth, cutoff.startDay)
    const endDay = clampDayToMonth(year, anchoredMonth, cutoff.endDay)

    return {
      start: new Date(year, anchoredMonth, startDay),
      end: new Date(year, anchoredMonth, endDay, 23, 59, 59, 999),
    }
  }

  if (day >= cutoff.startDay) {
    const startDay = clampDayToMonth(year, month, cutoff.startDay)
    const endDay = clampDayToMonth(year, month + 1, cutoff.endDay)

    return {
      start: new Date(year, month, startDay),
      end: new Date(year, month + 1, endDay, 23, 59, 59, 999),
    }
  }

  const startDay = clampDayToMonth(year, month - 1, cutoff.startDay)
  const endDay = clampDayToMonth(year, month, cutoff.endDay)

  return {
    start: new Date(year, month - 1, startDay),
    end: new Date(year, month, endDay, 23, 59, 59, 999),
  }
}

const getActiveCutoffForDate = (date: Date, cutoffs: CutoffDefinition[]) => {
  const day = date.getDate()

  return cutoffs.find((cutoff) => {
    if (!cutoff.isActive) return false

    if (cutoff.startDay <= cutoff.endDay) {
      return day >= cutoff.startDay && day <= cutoff.endDay
    }

    return day >= cutoff.startDay || day <= cutoff.endDay
  })
}

export default function AnalysisPage() {
  const { budgetData, snapshot } = useBudgetStore()

  const analysis = useMemo(() => {
    const now = new Date()
    const isCutoffMode = budgetData.settings.viewMode === 'cutoff'

    let currentRange: DateRange
    let previousRange: DateRange
    let periodTitle: string
    let periodSubtitle: string
    let currentCutoffId: string | undefined
    let previousCutoffId: string | undefined

    if (isCutoffMode) {
      const currentCutoff = snapshot.currentCutoff ?? getActiveCutoffForDate(now, budgetData.settings.cutoffs)

      if (!currentCutoff) {
        return {
          isCutoffMode,
          hasPeriod: false,
          periodTitle: 'No active cutoff matched today.',
          periodSubtitle: 'Check your cutoff day ranges in Budget Setup so Tantiya can compare payroll periods correctly.',
          currentRange: null,
          previousRange: null,
          currentExpenses: [],
          previousExpenses: [],
          currentTotal: 0,
          previousTotal: 0,
          difference: 0,
          bars: { current: 8, previous: 8 },
          topCategory: null,
          categoryBreakdown: [],
          increaseRate: null,
        }
      }

      currentRange = getCutoffRangeForDate(now, currentCutoff)
      currentCutoffId = currentCutoff.id
      const previousAnchor = shiftDays(currentRange.start, -1)
      const previousCutoff = getActiveCutoffForDate(previousAnchor, budgetData.settings.cutoffs)
      previousCutoffId = previousCutoff?.id

      previousRange = previousCutoff
        ? getCutoffRangeForDate(previousAnchor, previousCutoff)
        : {
            start: previousAnchor,
            end: previousAnchor,
          }

      periodTitle = currentCutoff.label
      periodSubtitle = `Comparing gastos charged to ${currentCutoff.label} (${toRangeLabel(currentRange)}) against the previous payroll period.`
    } else {
      currentRange = {
        start: startOfMonth(now),
        end: endOfMonth(now),
      }
      const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      previousRange = {
        start: startOfMonth(previousMonthDate),
        end: endOfMonth(previousMonthDate),
      }
      periodTitle = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      periodSubtitle = 'Comparing this month against the previous month.'
    }

    const currentExpenses =
      isCutoffMode && currentCutoffId
        ? getExpensesForCutoffAssignment(budgetData.expenses, currentCutoffId)
        : getExpensesForRange(budgetData.expenses, currentRange)
    const previousExpenses =
      isCutoffMode
        ? previousCutoffId
          ? getExpensesForCutoffAssignment(budgetData.expenses, previousCutoffId)
          : []
        : getExpensesForRange(budgetData.expenses, previousRange)
    const currentTotal = sumExpenseAmounts(currentExpenses)
    const previousTotal = sumExpenseAmounts(previousExpenses)
    const difference = currentTotal - previousTotal
    const categoryBreakdown = getCategoryBreakdown(currentExpenses)
    const bars = getBars(currentTotal, previousTotal)

    return {
      isCutoffMode,
      hasPeriod: true,
      periodTitle,
      periodSubtitle,
      currentRange,
      previousRange,
      currentExpenses,
      previousExpenses,
      currentTotal,
      previousTotal,
      difference,
      bars,
      topCategory: categoryBreakdown[0] ?? null,
      categoryBreakdown,
      increaseRate:
        previousTotal > 0 ? Math.round((Math.abs(difference) / previousTotal) * 100) : null,
    }
  }, [budgetData.expenses, budgetData.settings.cutoffs, budgetData.settings.viewMode, snapshot.currentCutoff])

  const differenceLabel =
    analysis.difference > 0
      ? 'Higher than previous period'
      : analysis.difference < 0
        ? 'Lower than previous period'
        : 'Same as previous period'

  return (
    <section className="space-y-6">
      <section className="surface-card rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] p-6 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700 dark:text-amber-300">
          Analysis
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">
          Spending signals and visual trends.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          See whether this period is more magastos than the last one, which category is pulling
          your budget down the fastest, and how the pattern looks visually.
        </p>
      </section>

      {!analysis.hasPeriod ? (
        <section className="surface-card rounded-[1.75rem] p-5">
          <p className="text-lg font-semibold text-foreground">{analysis.periodTitle}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{analysis.periodSubtitle}</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="surface-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Current period
              </p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
                {toCurrency(analysis.currentTotal)}
              </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {analysis.periodTitle}
                </p>
            </article>

            <article className="surface-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Previous period
              </p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
                {toCurrency(analysis.previousTotal)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {analysis.previousRange ? toRangeLabel(analysis.previousRange) : 'No previous period'}
              </p>
            </article>

            <article className="surface-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Comparison signal
              </p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
                {toCurrency(Math.abs(analysis.difference))}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {differenceLabel}
                {analysis.increaseRate != null ? ` · ${analysis.increaseRate}%` : ''}
              </p>
            </article>

            <article className="surface-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Top category
              </p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
                {analysis.topCategory ? analysis.topCategory.label : 'No gastos yet'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {analysis.topCategory
                  ? `${toCurrency(analysis.topCategory.amount)} in the current period`
                  : 'Add expenses to unlock category signals.'}
              </p>
            </article>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <section className="surface-card rounded-[1.75rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                    Period comparison
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {analysis.isCutoffMode
                      ? 'Comparing expenses by charged cutoff assignment.'
                      : 'A quick visual between the current and previous spending periods.'}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                  {analysis.currentExpenses.length} entries
                </span>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">Current</span>
                    <span className="text-muted-foreground">{toCurrency(analysis.currentTotal)}</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${analysis.bars.current}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">Previous</span>
                    <span className="text-muted-foreground">{toCurrency(analysis.previousTotal)}</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-stone-400 dark:bg-stone-500"
                      style={{ width: `${analysis.bars.previous}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-muted/50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Current range
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {analysis.currentRange ? toRangeLabel(analysis.currentRange) : 'Not available'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Previous range
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {analysis.previousRange ? toRangeLabel(analysis.previousRange) : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="surface-card rounded-[1.75rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Spending message
              </p>
              <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-4">
                <p className="text-lg font-semibold text-foreground">
                  {analysis.difference > 0
                    ? 'You are spending more this period.'
                    : analysis.difference < 0
                      ? 'You are spending less this period.'
                      : 'Your spending is steady so far.'}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {analysis.difference > 0
                    ? `${toCurrency(analysis.difference)} higher than the previous period.`
                    : analysis.difference < 0
                      ? `${toCurrency(Math.abs(analysis.difference))} lower than the previous period.`
                      : 'Current and previous periods are equal based on saved expenses.'}
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-muted/50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Entries counted
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                    {analysis.currentExpenses.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Trend call
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {analysis.topCategory
                      ? `${analysis.topCategory.label} is the biggest spending driver this period.`
                      : 'No trend yet. Add more spending data.'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="surface-card rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Category breakdown
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Which categories are driving this period&apos;s gastos.
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {analysis.currentExpenses.length} items
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {analysis.categoryBreakdown.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No expenses found in the active comparison period yet.
                </div>
              ) : (
                analysis.categoryBreakdown.map((category) => {
                  const share = analysis.currentTotal > 0
                    ? Math.round((category.amount / analysis.currentTotal) * 100)
                    : 0

                  return (
                    <div key={category.category} className="rounded-2xl bg-muted/50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{category.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {share}% of current period spending
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">
                          {toCurrency(category.amount)}
                        </p>
                      </div>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-card">
                        <div
                          className={`h-full rounded-full ${categoryColors[category.category]}`}
                          style={{ width: `${Math.max(share, 6)}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          <section className="surface-card rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Expense timeline
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {analysis.isCutoffMode
                    ? 'The latest entries charged to the active comparison cutoff.'
                    : 'The latest entries inside the active comparison period.'}
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {analysis.currentExpenses.length} events
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {analysis.currentExpenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No spending events in the active period yet.
                </div>
              ) : (
                analysis.currentExpenses
                  .slice()
                  .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
                  .slice(0, 6)
                  .map((expense) => (
                    <div
                      key={expense.id}
                      className="flex gap-4 rounded-2xl border border-border bg-card/50 px-4 py-4"
                    >
                      <div className="flex w-12 flex-none flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${categoryColors[expense.category]}`} />
                        <div className="mt-1 h-full w-px bg-border" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {categoryLabels[expense.category]}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {expense.note || 'No note'}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-semibold text-foreground">
                              {toCurrency(expense.amount)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Purchased on {new Date(expense.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>
        </>
      )}
    </section>
  )
}

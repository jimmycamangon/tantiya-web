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

const toCurrency = (value: number) => `PHP ${value.toLocaleString()}`

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

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

const sumExpenseAmounts = (expenses: ExpenseEntry[]) =>
  expenses.reduce((sum, expense) => sum + expense.amount, 0)

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

const getCutoffRangeForDate = (
  date: Date,
  cutoff: CutoffDefinition,
): DateRange => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()

  if (cutoff.startDay <= cutoff.endDay) {
    return {
      start: new Date(year, month, cutoff.startDay),
      end: new Date(year, month, cutoff.endDay, 23, 59, 59, 999),
    }
  }

  if (day >= cutoff.startDay) {
    return {
      start: new Date(year, month, cutoff.startDay),
      end: new Date(year, month + 1, cutoff.endDay, 23, 59, 59, 999),
    }
  }

  return {
    start: new Date(year, month - 1, cutoff.startDay),
    end: new Date(year, month, cutoff.endDay, 23, 59, 59, 999),
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
          topCategory: null,
          categoryBreakdown: [],
        }
      }

      currentRange = getCutoffRangeForDate(now, currentCutoff)
      const previousAnchor = shiftDays(currentRange.start, -1)
      const previousCutoff = getActiveCutoffForDate(previousAnchor, budgetData.settings.cutoffs)

      previousRange = previousCutoff
        ? getCutoffRangeForDate(previousAnchor, previousCutoff)
        : {
            start: previousAnchor,
            end: previousAnchor,
          }

      periodTitle = currentCutoff.label
      periodSubtitle = `Comparing ${toRangeLabel(currentRange)} against the previous payroll period.`
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

    const currentExpenses = getExpensesForRange(budgetData.expenses, currentRange)
    const previousExpenses = getExpensesForRange(budgetData.expenses, previousRange)
    const currentTotal = sumExpenseAmounts(currentExpenses)
    const previousTotal = sumExpenseAmounts(previousExpenses)
    const difference = currentTotal - previousTotal
    const categoryBreakdown = getCategoryBreakdown(currentExpenses)

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
      topCategory: categoryBreakdown[0] ?? null,
      categoryBreakdown,
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
          Spending signals and comparisons.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          See whether this period is more magastos than the last one and which category is pulling
          your budget down the fastest.
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

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
            <section className="surface-card rounded-[1.75rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Active period
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-foreground">
                {analysis.periodTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {analysis.periodSubtitle}
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                    Entries counted
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {analysis.currentExpenses.length} expense item(s)
                  </p>
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
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </>
      )}
    </section>
  )
}

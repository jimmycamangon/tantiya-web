import { useMemo, useState } from 'react'
import { useBudgetStore } from '@/hooks/useBudgetStore'
import type { ExpenseCategory } from '@/types/budget'

const categoryOptions: Array<{ id: ExpenseCategory; label: string }> = [
  { id: 'food', label: 'Food' },
  { id: 'fare', label: 'Fare' },
  { id: 'house', label: 'House' },
  { id: 'bills', label: 'Bills' },
  { id: 'load', label: 'Load' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'other', label: 'Other' },
]

const toCurrency = (value: number) => `PHP ${value.toLocaleString()}`

export default function QuickDeductPage() {
  const { budgetData, snapshot, addExpense, removeExpense } = useBudgetStore()
  const isCutoffMode = budgetData.settings.viewMode === 'cutoff'
  const scopedTotals = isCutoffMode ? snapshot.currentPeriodTotals : snapshot.totals
  const [selectedAmount, setSelectedAmount] = useState<number | null>(
    budgetData.settings.quickAmountPresets[0]?.value ?? 20,
  )
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('food')
  const [note, setNote] = useState('')

  const currentCutoff = snapshot.currentCutoff
  const currentCutoffLabel = currentCutoff ? currentCutoff.label : isCutoffMode ? 'Not set' : 'Monthly cycle'
  const recentExpenses = useMemo(
    () => budgetData.expenses.slice().sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 8),
    [budgetData.expenses],
  )

  const quickDeduct = () => {
    if (!selectedAmount || selectedAmount <= 0) return

    addExpense({
      amount: selectedAmount,
      category: selectedCategory,
      cutoffId: currentCutoff?.id,
      note: note.trim() || undefined,
      source: 'quick-tap',
    })

    setNote('')
  }

  const recentTotal = useMemo(
    () => recentExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [recentExpenses],
  )

  const projectedRemaining = scopedTotals.remainingBudget - (selectedAmount ?? 0)

  return (
    <section className="space-y-6">
      <div className="surface-card rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] p-6 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700 dark:text-amber-300">
          Quick deduct
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">
          Deduct gastos in just a few taps.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          Pick an amount, assign a category, and instantly reduce your remaining budget without
          going through a long entry form.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <div className="space-y-4">
          <section className="surface-card rounded-[1.75rem] border border-emerald-300/60 bg-[linear-gradient(135deg,rgba(5,150,105,0.14),rgba(255,255,255,0.08))] p-5 shadow-[0_20px_50px_rgba(5,150,105,0.12)] dark:border-emerald-800/60 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0.02))]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="emerald-copy text-xs font-bold uppercase tracking-[0.24em]">
                  Ready to deduct
                </p>
                <p className="mt-3 text-4xl font-bold tracking-[-0.06em] text-foreground">
                  {selectedAmount ? toCurrency(selectedAmount) : 'PHP 0'}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {categoryOptions.find((category) => category.id === selectedCategory)?.label} will be charged to{' '}
                  {currentCutoffLabel}.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/40 bg-white/45 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current budget</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {toCurrency(scopedTotals.remainingBudget)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/40 bg-white/45 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">After tap</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {toCurrency(projectedRemaining)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="surface-card rounded-[1.75rem] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Live budget
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-muted/50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Remaining
                </p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                  {toCurrency(scopedTotals.remainingBudget)}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {isCutoffMode ? 'Charged to cutoff' : 'Budget cycle'}
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {currentCutoffLabel}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Logged gastos
                </p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                  {toCurrency(scopedTotals.totalVariableExpenses)}
                </p>
              </div>
            </div>
          </section>

          <section className="surface-card rounded-[1.75rem] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Amount presets
            </p>
            <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {budgetData.settings.quickAmountPresets.map((preset) => {
                const isSelected = selectedAmount === preset.value

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedAmount(preset.value)}
                    className={[
                      'min-h-[7.5rem] rounded-2xl border px-4 py-4 text-left transition-all duration-200',
                      isSelected
                        ? 'border-emerald-800 bg-emerald-700 text-emerald-50 shadow-[0_14px_30px_rgba(6,78,59,0.2)] dark:border-emerald-600 dark:bg-emerald-800 dark:text-emerald-50'
                        : 'border-border bg-card hover:bg-accent',
                    ].join(' ')}
                  >
                    <p
                      className={[
                        'text-xs uppercase tracking-[0.18em]',
                        isSelected ? 'text-emerald-100/80' : 'text-muted-foreground',
                      ].join(' ')}
                    >
                      Tap amount
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">
                      {toCurrency(preset.value)}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="surface-card rounded-[1.75rem] p-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Category
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categoryOptions.map((category) => {
                    const isSelected = selectedCategory === category.id

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={[
                          'rounded-full border px-4 py-3 text-sm font-medium transition-colors',
                          isSelected
                            ? 'border-emerald-800 bg-emerald-700 text-emerald-50 shadow-[0_10px_20px_rgba(6,78,59,0.12)] dark:border-emerald-600 dark:bg-emerald-800 dark:text-emerald-50'
                            : 'border-border bg-card text-foreground hover:bg-accent',
                        ].join(' ')}
                      >
                        {category.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Optional note
                </p>
                <input
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="ui-input"
                  placeholder="ex. lunch, pamasahe, load"
                />
                <button
                  type="button"
                  onClick={quickDeduct}
                  disabled={!selectedAmount}
                  className="public-primary-button mt-3 hidden w-full disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
                >
                  Deduct {selectedAmount ? toCurrency(selectedAmount) : ''}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface-card rounded-[1.75rem] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Deduction preview
            </p>
            <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-4">
              <p className="text-sm text-muted-foreground">Selected category</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {categoryOptions.find((category) => category.id === selectedCategory)?.label}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">Amount to deduct</p>
              <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-foreground">
                {selectedAmount ? toCurrency(selectedAmount) : 'PHP 0'}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">Budget after tap</p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                {toCurrency(projectedRemaining)}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Purchased on
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Charged to
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {currentCutoffLabel}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="surface-card rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Recent deductions
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Latest quick-tap gastos saved in local storage.
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {toCurrency(recentTotal)}
              </span>
            </div>

            <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {recentExpenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No deductions yet. Tap an amount to start tracking gastos.
                </div>
              ) : (
                recentExpenses.map((expense) => (
                  <div key={expense.id} className="rounded-2xl bg-muted/50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold capitalize text-foreground">
                          {expense.category}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {expense.note || 'No note'}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Charged to:{' '}
                          {expense.cutoffId
                            ? budgetData.settings.cutoffs.find((cutoff) => cutoff.id === expense.cutoffId)?.label ?? 'Assigned cutoff'
                            : 'No cutoff tag'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {toCurrency(expense.amount)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Purchased on {new Date(expense.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeExpense(expense.id)}
                        className="ui-button-subtle"
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-4 z-30 md:hidden">
        <div className="surface-card mx-auto flex items-center justify-between gap-3 rounded-2xl border border-emerald-300/60 bg-[linear-gradient(135deg,rgba(5,150,105,0.16),rgba(255,255,255,0.08))] px-4 py-3 shadow-[0_20px_40px_rgba(15,23,42,0.14)] dark:border-emerald-800/60 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(255,255,255,0.02))]">
          <div className="min-w-0">
            <p className="emerald-copy text-xs uppercase tracking-[0.18em]">
              Selected tap
            </p>
            <p className="mt-1 truncate text-lg font-semibold text-foreground">
              {selectedAmount ? toCurrency(selectedAmount) : 'Pick an amount'}
            </p>
            <p className="text-xs text-muted-foreground">
              {categoryOptions.find((category) => category.id === selectedCategory)?.label} • {currentCutoffLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={quickDeduct}
            disabled={!selectedAmount}
            className="public-primary-button px-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Deduct
          </button>
        </div>
      </div>
    </section>
  )
}

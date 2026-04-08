import { useMemo, useState } from 'react'
import { useBudgetStore } from '@/hooks/useBudgetStore'
import type { ExpenseCategory, ExpenseEntry } from '@/types/budget'

const categoryOptions: Array<{ value: 'all' | ExpenseCategory; label: string }> = [
  { value: 'all', label: 'All categories' },
  { value: 'food', label: 'Food' },
  { value: 'fare', label: 'Fare' },
  { value: 'house', label: 'House' },
  { value: 'bills', label: 'Bills' },
  { value: 'load', label: 'Load' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
]

const toCurrency = (value: number) => `PHP ${value.toLocaleString()}`

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

const isWithinCurrentMonth = (createdAt: string) => {
  const date = new Date(createdAt)
  const now = new Date()
  return date >= startOfMonth(now) && date <= endOfMonth(now)
}

export default function HistoryPage() {
  const { budgetData, snapshot, removeExpense, updateExpense } = useBudgetStore()
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all')
  const [periodFilter, setPeriodFilter] = useState<'all' | 'current-cutoff' | 'current-month'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    amount: string
    category: ExpenseCategory
    note: string
    cutoffId: string
  }>({
    amount: '',
    category: 'food',
    note: '',
    cutoffId: '',
  })

  const activeCutoffs = useMemo(
    () => budgetData.settings.cutoffs.filter((cutoff) => cutoff.isActive),
    [budgetData.settings.cutoffs],
  )

  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return budgetData.expenses
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .filter((expense) => {
        if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
          return false
        }

        if (periodFilter === 'current-cutoff') {
          if (!snapshot.currentCutoff || expense.cutoffId !== snapshot.currentCutoff.id) {
            return false
          }
        }

        if (periodFilter === 'current-month' && !isWithinCurrentMonth(expense.createdAt)) {
          return false
        }

        if (!query) {
          return true
        }

        return (
          expense.category.toLowerCase().includes(query) ||
          (expense.note ?? '').toLowerCase().includes(query)
        )
      })
  }, [budgetData.expenses, categoryFilter, periodFilter, searchQuery, snapshot.currentCutoff])

  const historyTotal = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [filteredExpenses],
  )
  const monthExpenseTotal = useMemo(
    () =>
      budgetData.expenses.reduce((sum, expense) => {
        if (!isWithinCurrentMonth(expense.createdAt)) return sum
        return sum + expense.amount
      }, 0),
    [budgetData.expenses],
  )

  const startEditing = (expense: ExpenseEntry) => {
    setEditingExpenseId(expense.id)
    setEditDraft({
      amount: String(expense.amount),
      category: expense.category,
      note: expense.note ?? '',
      cutoffId: expense.cutoffId ?? '',
    })
  }

  const saveEdit = () => {
    if (!editingExpenseId) return

    const parsedAmount = Number(editDraft.amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return

    updateExpense(editingExpenseId, {
      amount: parsedAmount,
      category: editDraft.category,
      note: editDraft.note.trim() || undefined,
      cutoffId: editDraft.cutoffId || undefined,
    })

    setEditingExpenseId(null)
  }

  const editingExpense = editingExpenseId
    ? budgetData.expenses.find((expense) => expense.id === editingExpenseId)
    : null

  return (
    <section className="space-y-6">
      <section className="surface-card rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] p-6 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700 dark:text-amber-300">
          History
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">
          Review and correct your saved gastos.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          This is your transaction trail. Filter what you logged, search notes, and fix wrong taps
          without losing track of the rest of your budget.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/40 bg-white/45 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Saved expenses</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
              {budgetData.expenses.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/40 bg-white/45 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">This month</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
              {toCurrency(monthExpenseTotal)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/40 bg-white/45 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current focus</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {budgetData.settings.viewMode === 'cutoff'
                ? snapshot.currentCutoff?.label ?? 'Automatic not matched'
                : 'Monthly mode'}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[1.75rem] p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem_14rem]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Search note or category</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="ui-input"
              placeholder="Search lunch, fare, bills..."
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Category</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as 'all' | ExpenseCategory)}
              className="ui-input"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Period</span>
            <select
              value={periodFilter}
              onChange={(event) =>
                setPeriodFilter(event.target.value as 'all' | 'current-cutoff' | 'current-month')
              }
              className="ui-input"
            >
              <option value="all">All entries</option>
              <option value="current-month">Current month</option>
              {budgetData.settings.viewMode === 'cutoff' && (
                <option value="current-cutoff">Current cutoff</option>
              )}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-muted/50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Entries shown</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
              {filteredExpenses.length}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Filtered total</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
              {toCurrency(historyTotal)}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active cutoff</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {budgetData.settings.viewMode === 'cutoff'
                ? snapshot.currentCutoff?.label ?? 'Automatic not matched'
                : 'Monthly mode'}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[1.75rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Saved deductions
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Edit the amount, category, note, or cutoff assignment whenever a quick tap needs correction.
            </p>
          </div>
        </div>

        <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
          {filteredExpenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              No matching expense entries yet.
            </div>
          ) : (
            filteredExpenses.map((expense) => {
              const cutoffLabel = expense.cutoffId
                ? budgetData.settings.cutoffs.find((cutoff) => cutoff.id === expense.cutoffId)?.label ?? 'Assigned cutoff'
                : 'No cutoff tag'

              return (
                <article key={expense.id} className="rounded-2xl bg-muted/50 px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold capitalize text-foreground">{expense.category}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {expense.note || 'No note'}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>Purchased on: {new Date(expense.createdAt).toLocaleString()}</p>
                        <p>Charged to: {cutoffLabel}</p>
                        <p className="hidden">
                        {new Date(expense.createdAt).toLocaleString()} · {cutoffLabel}
                        </p>
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {toCurrency(expense.amount)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {expense.source}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(expense)}
                      className="ui-button-subtle"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExpense(expense.id)}
                      className="ui-button-subtle"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>

      {editingExpense && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="surface-card w-full max-w-xl p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Edit deduction
                </p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  Update saved expense
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingExpenseId(null)}
                className="ui-button-subtle"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Amount</span>
                <input
                  type="number"
                  min="0"
                  value={editDraft.amount}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, amount: event.target.value }))
                  }
                  className="ui-input"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Category</span>
                <select
                  value={editDraft.category}
                  onChange={(event) =>
                    setEditDraft((current) => ({
                      ...current,
                      category: event.target.value as ExpenseCategory,
                    }))
                  }
                  className="ui-input"
                >
                  {categoryOptions
                    .filter((option) => option.value !== 'all')
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Note</span>
                <input
                  type="text"
                  value={editDraft.note}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, note: event.target.value }))
                  }
                  className="ui-input"
                  placeholder="ex. lunch, grocery, pamasahe"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Cutoff assignment</span>
                <select
                  value={editDraft.cutoffId}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, cutoffId: event.target.value }))
                  }
                  className="ui-input"
                >
                  <option value="">No cutoff tag</option>
                  {activeCutoffs.map((cutoff) => (
                    <option key={cutoff.id} value={cutoff.id}>
                      {cutoff.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs leading-6 text-muted-foreground">
                  This changes which cutoff budget absorbs the expense. It does not change the
                  original purchase date.
                </p>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingExpenseId(null)}
                className="ui-button py-2"
              >
                Cancel
              </button>
              <button type="button" onClick={saveEdit} className="ui-button">
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

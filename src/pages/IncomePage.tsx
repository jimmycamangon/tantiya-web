import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBudgetStore } from '@/hooks/useBudgetStore'
import type { IncomeEntry } from '@/types/budget'

const toCurrency = (value: number) => `PHP ${value.toLocaleString()}`

const toDateInputValue = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

export default function IncomePage() {
  const { budgetData, addIncome, removeIncome, updateIncome } = useBudgetStore()
  const isCutoffMode = budgetData.settings.viewMode === 'cutoff'
  const activeCutoffs = useMemo(
    () => budgetData.settings.cutoffs.filter((cutoff) => cutoff.isActive),
    [budgetData.settings.cutoffs],
  )
  const expectedIncomeTotal = useMemo(
    () =>
      activeCutoffs.reduce((sum, cutoff) => sum + (cutoff.expectedIncomeAmount ?? 0), 0),
    [activeCutoffs],
  )
  const actualIncomeTotal = useMemo(
    () => budgetData.incomes.reduce((sum, income) => sum + income.amount, 0),
    [budgetData.incomes],
  )

  const [label, setLabel] = useState('Salary')
  const [amount, setAmount] = useState('')
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [cutoffId, setCutoffId] = useState('')
  const [notes, setNotes] = useState('')
  const [filterCutoffId, setFilterCutoffId] = useState<'all' | string>('all')
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({
    label: '',
    amount: '',
    receivedAt: '',
    cutoffId: '',
    notes: '',
  })

  const filteredIncomes = useMemo(() => {
    return budgetData.incomes
      .slice()
      .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
      .filter((income) => {
        if (filterCutoffId === 'all') {
          return true
        }

        return income.cutoffId === filterCutoffId
      })
  }, [budgetData.incomes, filterCutoffId])

  const filteredIncomeTotal = useMemo(
    () => filteredIncomes.reduce((sum, income) => sum + income.amount, 0),
    [filteredIncomes],
  )
  const incomeDifference =
    actualIncomeTotal -
    (isCutoffMode ? expectedIncomeTotal : budgetData.settings.monthlyIncomeTarget)

  const addIncomeEntry = () => {
    const parsedAmount = Number(amount)
    if (!label.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return
    }

    addIncome({
      label: label.trim(),
      amount: parsedAmount,
      receivedAt: receivedAt ? new Date(`${receivedAt}T00:00:00`).toISOString() : undefined,
      cutoffId: cutoffId || undefined,
      notes: notes.trim() || undefined,
    })

    setAmount('')
    setNotes('')
  }

  const startEditing = (income: IncomeEntry) => {
    setEditingIncomeId(income.id)
    setEditDraft({
      label: income.label,
      amount: String(income.amount),
      receivedAt: toDateInputValue(income.receivedAt),
      cutoffId: income.cutoffId ?? '',
      notes: income.notes ?? '',
    })
  }

  const saveEdit = () => {
    if (!editingIncomeId) return

    const parsedAmount = Number(editDraft.amount)
    if (!editDraft.label.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return
    }

    updateIncome(editingIncomeId, {
      label: editDraft.label.trim(),
      amount: parsedAmount,
      receivedAt: editDraft.receivedAt
        ? new Date(`${editDraft.receivedAt}T00:00:00`).toISOString()
        : undefined,
      cutoffId: editDraft.cutoffId || undefined,
      notes: editDraft.notes.trim() || undefined,
    })

    setEditingIncomeId(null)
  }

  return (
    <section className="space-y-6">
      <section className="surface-card rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,252,246,0.82),rgba(244,239,226,0.48))] p-6 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700 dark:text-amber-300">
          Income
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">
          Log the salary you actually received.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          Use this page for real income entries like salary, allowance, or other income. Once you
          start logging actual amounts, Tantiya uses them in the budget instead of relying only on
          expected setup values.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/dashboard" className="public-outline-button px-5">
            Go to dashboard
          </Link>
          <Link to="/setup" className="public-primary-button px-5">
            Review setup income
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-amber-200/70 bg-[rgba(255,251,244,0.76)] px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Actual total</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
              {toCurrency(actualIncomeTotal)}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200/70 bg-[rgba(255,251,244,0.76)] px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Expected total</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
              {toCurrency(isCutoffMode ? expectedIncomeTotal : budgetData.settings.monthlyIncomeTarget)}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200/70 bg-[rgba(255,251,244,0.76)] px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Variance</p>
            <p
              className={[
                'mt-2 text-2xl font-bold tracking-[-0.04em]',
                incomeDifference >= 0 ? 'emerald-copy' : 'text-amber-700 dark:text-amber-300',
              ].join(' ')}
            >
              {toCurrency(incomeDifference)}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200/70 bg-[rgba(255,251,244,0.76)] px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Saved entries</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
              {budgetData.incomes.length}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
        <section className="surface-card rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
            Add income entry
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Record the income you truly received, then assign it to a cutoff if it belongs to a payroll period.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Label</span>
              <input
                type="text"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className="ui-input"
                placeholder="Salary"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Amount</span>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="ui-input"
                placeholder="16500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Received date</span>
              <input
                type="date"
                value={receivedAt}
                onChange={(event) => setReceivedAt(event.target.value)}
                className="ui-input"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Cutoff assignment</span>
              <select
                value={cutoffId}
                onChange={(event) => setCutoffId(event.target.value)}
                className="ui-input"
                disabled={!isCutoffMode}
              >
                <option value="">No cutoff tag</option>
                {activeCutoffs.map((cutoff) => (
                  <option key={cutoff.id} value={cutoff.id}>
                    {cutoff.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Notes</span>
              <input
                type="text"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="ui-input"
                placeholder="ex. April 1-15 salary, allowance included"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="button" onClick={addIncomeEntry} className="public-primary-button px-5">
              Save income
            </button>
          </div>
        </section>

        <section className="surface-card rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
            Income focus
          </p>
          <div className="mt-4 space-y-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Show entries for</span>
              <select
                value={filterCutoffId}
                onChange={(event) => setFilterCutoffId(event.target.value)}
                className="ui-input"
              >
                <option value="all">All income entries</option>
                {activeCutoffs.map((cutoff) => (
                  <option key={cutoff.id} value={cutoff.id}>
                    {cutoff.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl bg-muted/50 px-4 py-4">
              <p className="text-sm font-medium text-foreground">Filtered total</p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                {toCurrency(filteredIncomeTotal)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Use this to compare what actually came in for one cutoff or for all income entries combined.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-border px-4 py-4">
              <p className="font-semibold text-foreground">Expected vs actual</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Setup holds your expected income plan. This page holds the real income you actually received.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="surface-card rounded-[1.75rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Saved income entries
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Actual salary and allowance records that Tantiya uses for live budget totals.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {filteredIncomes.length} item(s)
          </span>
        </div>

        <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
          {filteredIncomes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              No income entries yet. Add the salary you actually received to start using real income totals.
            </div>
          ) : (
            filteredIncomes.map((income) => {
              const cutoffLabel = income.cutoffId
                ? budgetData.settings.cutoffs.find((cutoff) => cutoff.id === income.cutoffId)?.label ?? 'Assigned cutoff'
                : 'No cutoff tag'

              return (
                <article key={income.id} className="rounded-2xl bg-muted/50 px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{income.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {income.notes || 'No notes'}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>Received on: {new Date(income.receivedAt).toLocaleDateString()}</p>
                        <p>Assigned to: {cutoffLabel}</p>
                      </div>
                      <p className="hidden">
                        {new Date(income.receivedAt).toLocaleDateString()} · {cutoffLabel}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {toCurrency(income.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(income)}
                      className="ui-button-subtle"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeIncome(income.id)}
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

      {editingIncomeId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="surface-card w-full max-w-xl p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Edit income
                </p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  Update saved income entry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingIncomeId(null)}
                className="ui-button-subtle"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Label</span>
                <input
                  type="text"
                  value={editDraft.label}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, label: event.target.value }))
                  }
                  className="ui-input"
                />
              </label>

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
                <span className="text-sm font-medium text-foreground">Received date</span>
                <input
                  type="date"
                  value={editDraft.receivedAt}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, receivedAt: event.target.value }))
                  }
                  className="ui-input"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Cutoff assignment</span>
                <select
                  value={editDraft.cutoffId}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, cutoffId: event.target.value }))
                  }
                  className="ui-input"
                  disabled={!isCutoffMode}
                >
                  <option value="">No cutoff tag</option>
                  {activeCutoffs.map((cutoff) => (
                    <option key={cutoff.id} value={cutoff.id}>
                      {cutoff.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Notes</span>
                <input
                  type="text"
                  value={editDraft.notes}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                  className="ui-input"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingIncomeId(null)}
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

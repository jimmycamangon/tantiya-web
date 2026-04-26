import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBudgetStore } from '@/hooks/useBudgetStore'

const toCurrency = (value: number) => `PHP ${value.toLocaleString()}`

const getExpectedPayoutLabel = (offsetDays?: number) => {
  if (offsetDays == null || offsetDays <= 0) {
    return 'Same day payout'
  }

  if (offsetDays === 1) {
    return '1 day after cutoff'
  }

  return `${offsetDays} days after cutoff`
}

export default function CutoffsPage() {
  const { budgetData, patchSettings, snapshot } = useBudgetStore()
  const isCutoffMode = budgetData.settings.viewMode === 'cutoff'
  const [carryoverAmount, setCarryoverAmount] = useState(
    String(budgetData.settings.cutoffCarryoverPlan.amount || ''),
  )
  const [carryoverCutoffId, setCarryoverCutoffId] = useState(
    budgetData.settings.cutoffCarryoverPlan.cutoffId ?? snapshot.currentCutoff?.id ?? '',
  )
  const [carryoverNote, setCarryoverNote] = useState(budgetData.settings.cutoffCarryoverPlan.note ?? '')

  useEffect(() => {
    setCarryoverAmount(
      budgetData.settings.cutoffCarryoverPlan.amount > 0
        ? String(budgetData.settings.cutoffCarryoverPlan.amount)
        : '',
    )
    setCarryoverCutoffId(
      budgetData.settings.cutoffCarryoverPlan.cutoffId ?? snapshot.currentCutoff?.id ?? '',
    )
    setCarryoverNote(budgetData.settings.cutoffCarryoverPlan.note ?? '')
  }, [budgetData.settings.cutoffCarryoverPlan, snapshot.currentCutoff])

  const cutoffCards = useMemo(() => {
    return budgetData.settings.cutoffs
      .filter((cutoff) => cutoff.isActive)
      .map((cutoff) => {
        const summary = snapshot.cutoffSummaries.find((item) => item.cutoffId === cutoff.id)

        return {
          id: cutoff.id,
          label: cutoff.label,
          rangeLabel: `${cutoff.startDay}-${cutoff.endDay}`,
          payoutLabel: getExpectedPayoutLabel(cutoff.expectedPayoutOffsetDays),
          totalIncome: summary?.totalIncome ?? 0,
          carryoverAmount: summary?.carryoverAmount ?? 0,
          totalExpenses: summary?.totalExpenses ?? 0,
          remainingBudget: summary?.remainingBudget ?? 0,
          isCurrent: snapshot.currentCutoff?.id === cutoff.id,
        }
      })
  }, [budgetData.settings.cutoffs, snapshot.currentCutoff, snapshot.cutoffSummaries])

  const totalTrackedCutoffExpenses = cutoffCards.reduce((sum, cutoff) => sum + cutoff.totalExpenses, 0)
  const saveCarryover = () => {
    const nextAmount = Number(carryoverAmount)
    const normalizedAmount = Number.isFinite(nextAmount) && nextAmount > 0 ? nextAmount : 0

    patchSettings({
      cutoffCarryoverPlan: {
        enabled: normalizedAmount > 0 && carryoverCutoffId.length > 0,
        amount: normalizedAmount,
        cutoffId: carryoverCutoffId || undefined,
        note: carryoverNote.trim(),
      },
    })
  }

  return (
    <section className="space-y-6">
      <section className="surface-card rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] p-6 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700 dark:text-amber-300">
          Cutoff tracking
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">
          Read each budget period clearly.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          Review your declared payroll cycles, see which one is active today, and check the totals
          already assigned to each cutoff.
        </p>
      </section>

      {!isCutoffMode ? (
        <section className="surface-card rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
            Monthly mode
          </p>
          <h3 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-foreground">
            Cutoff tracking is currently turned off.
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            Your setup is using one whole-month budget, so this page does not split spending by
            payroll periods. If you want kinsenas or custom cutoff tracking, switch your budget
            cycle in setup.
          </p>
          <div className="mt-6">
            <Link to="/setup" className="public-outline-button px-5">
              Open budget setup
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="surface-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Active cutoff
              </p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
                {snapshot.currentCutoff ? snapshot.currentCutoff.label : 'Not matched'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {snapshot.currentCutoff
                  ? `Days ${snapshot.currentCutoff.startDay}-${snapshot.currentCutoff.endDay}`
                  : 'Today does not fall into any active cutoff rule yet.'}
              </p>
            </article>

            <article className="surface-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Active cutoffs
              </p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
                {cutoffCards.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Payroll periods ready for comparison.
              </p>
            </article>

            <article className="surface-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Tracked cutoff gastos
              </p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
                {toCurrency(totalTrackedCutoffExpenses)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Expenses already grouped into declared cutoff periods.
              </p>
            </article>

            <article className="surface-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Unassigned gastos
              </p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
                {toCurrency(snapshot.totals.totalVariableExpenses - totalTrackedCutoffExpenses)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Expenses saved without a matched cutoff period.
              </p>
            </article>
          </section>

          <section className="surface-card rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Carryover wallet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add the leftover amount from your previous cutoff to the cutoff you are using now
                  so the live balance reflects what is still in your wallet.
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                <p className="text-muted-foreground">Active carryover</p>
                <p className="mt-1 font-semibold text-foreground">
                  {toCurrency(budgetData.settings.cutoffCarryoverPlan.amount)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Apply carryover to</span>
                <select
                  value={carryoverCutoffId}
                  onChange={(event) => setCarryoverCutoffId(event.target.value)}
                  className="ui-input"
                >
                  <option value="">No cutoff selected</option>
                  {budgetData.settings.cutoffs
                    .filter((cutoff) => cutoff.isActive)
                    .map((cutoff) => (
                      <option key={cutoff.id} value={cutoff.id}>
                        {cutoff.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Carryover amount</span>
                <input
                  type="number"
                  min="0"
                  value={carryoverAmount}
                  onChange={(event) => setCarryoverAmount(event.target.value)}
                  className="ui-input"
                  placeholder="2500"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Note</span>
                <input
                  type="text"
                  value={carryoverNote}
                  onChange={(event) => setCarryoverNote(event.target.value)}
                  className="ui-input"
                  placeholder="Left from last cutoff"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={saveCarryover} className="public-primary-button px-5">
                Save carryover
              </button>
              <button
                type="button"
                onClick={() => {
                  setCarryoverAmount('')
                  setCarryoverCutoffId(snapshot.currentCutoff?.id ?? '')
                  setCarryoverNote('')
                  patchSettings({
                    cutoffCarryoverPlan: {
                      enabled: false,
                      amount: 0,
                      cutoffId: undefined,
                      note: '',
                    },
                  })
                }}
                className="public-outline-button px-5"
              >
                Clear carryover
              </button>
            </div>
          </section>

          <section className="surface-card rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Declared cutoffs
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your payroll ranges, payout offsets, and live totals per cutoff.
                </p>
              </div>
              <Link to="/setup" className="public-outline-button px-5">
                Edit cutoff rules
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {cutoffCards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No active cutoffs configured yet.
                </div>
              ) : (
                cutoffCards.map((cutoff) => (
                  <article
                    key={cutoff.id}
                    className={[
                      'rounded-2xl border p-4 transition-colors',
                      cutoff.isCurrent
                        ? 'border-emerald-800 bg-emerald-700 text-emerald-50 dark:border-emerald-600 dark:bg-emerald-800'
                        : 'border-border bg-muted/50',
                    ].join(' ')}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold">
                            {cutoff.label}
                          </p>
                          {cutoff.isCurrent && (
                            <span className="rounded-full border border-emerald-50/25 bg-emerald-950/15 px-3 py-1 text-xs font-medium text-emerald-50">
                              Current
                            </span>
                          )}
                        </div>
                        <p className={cutoff.isCurrent ? 'mt-2 text-sm text-emerald-100/85' : 'mt-2 text-sm text-muted-foreground'}>
                          Range: days {cutoff.rangeLabel} · Payout: {cutoff.payoutLabel}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 sm:text-right">
                        <div>
                          <p className={cutoff.isCurrent ? 'text-xs uppercase tracking-[0.16em] text-emerald-100/75' : 'text-xs uppercase tracking-[0.16em] text-muted-foreground'}>
                            Income
                          </p>
                          <p className="mt-1 font-semibold">
                            {toCurrency(cutoff.totalIncome)}
                          </p>
                        </div>
                        <div>
                          <p className={cutoff.isCurrent ? 'text-xs uppercase tracking-[0.16em] text-emerald-100/75' : 'text-xs uppercase tracking-[0.16em] text-muted-foreground'}>
                            Expenses
                          </p>
                          <p className="mt-1 font-semibold">
                            {toCurrency(cutoff.totalExpenses)}
                          </p>
                        </div>
                        <div>
                          <p className={cutoff.isCurrent ? 'text-xs uppercase tracking-[0.16em] text-emerald-100/75' : 'text-xs uppercase tracking-[0.16em] text-muted-foreground'}>
                            Carryover
                          </p>
                          <p className="mt-1 font-semibold">
                            {toCurrency(cutoff.carryoverAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:min-w-[9rem] sm:text-right">
                        <div>
                          <p className={cutoff.isCurrent ? 'text-xs uppercase tracking-[0.16em] text-emerald-100/75' : 'text-xs uppercase tracking-[0.16em] text-muted-foreground'}>
                            Remaining
                          </p>
                          <p className="mt-1 font-semibold">
                            {toCurrency(cutoff.remainingBudget)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </section>
  )
}

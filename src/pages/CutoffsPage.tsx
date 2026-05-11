import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getFixedExpenseAmountForCutoff,
  getCutoffRangeForMonth,
  getHousingAmountForCutoff,
  isDateInSameMonth,
} from '@/features/budget/calculations'
import { useBudgetStore } from '@/hooks/useBudgetStore'
import type { ExpenseCategory } from '@/types/budget'

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
  const [previewCutoffId, setPreviewCutoffId] = useState(
    snapshot.currentCutoff?.id ?? budgetData.settings.cutoffs.find((cutoff) => cutoff.isActive)?.id ?? '',
  )

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
        const committedCost =
          (summary?.totalFixedExpenses ?? 0) +
          (summary?.totalPayrollDeductions ?? 0) +
          (summary?.totalHousingCost ?? 0) +
          (summary?.totalExpenses ?? 0)

        return {
          id: cutoff.id,
          label: cutoff.label,
          rangeLabel: `${cutoff.startDay}-${cutoff.endDay}`,
          payoutLabel: getExpectedPayoutLabel(cutoff.expectedPayoutOffsetDays),
          totalIncome: summary?.totalIncome ?? 0,
          carryoverAmount: summary?.carryoverAmount ?? 0,
          totalExpenses: summary?.totalExpenses ?? 0,
          committedCost,
          remainingBudget: summary?.remainingBudget ?? 0,
          isCurrent: snapshot.currentCutoff?.id === cutoff.id,
        }
      })
  }, [budgetData.settings.cutoffs, snapshot.currentCutoff, snapshot.cutoffSummaries])

  useEffect(() => {
    if (!isCutoffMode) {
      return
    }

    if (!cutoffCards.some((cutoff) => cutoff.id === previewCutoffId)) {
      setPreviewCutoffId(snapshot.currentCutoff?.id ?? cutoffCards[0]?.id ?? '')
    }
  }, [cutoffCards, isCutoffMode, previewCutoffId, snapshot.currentCutoff])

  const cutoffCostPreview = useMemo(() => {
    const cutoff = budgetData.settings.cutoffs.find((item) => item.id === previewCutoffId)
    const summary = snapshot.cutoffSummaries.find((item) => item.cutoffId === previewCutoffId)

    if (!cutoff || !summary) {
      return null
    }

    const cutoffRange = getCutoffRangeForMonth(new Date(), cutoff)
    const variableExpenses = budgetData.expenses
      .filter(
        (expense) =>
          expense.cutoffId === previewCutoffId &&
          isDateInSameMonth(expense.createdAt, new Date()),
      )
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    const categoryTotals = variableExpenses.reduce<Record<ExpenseCategory, number>>(
      (totals, expense) => ({
        ...totals,
        [expense.category]: totals[expense.category] + expense.amount,
      }),
      {
        food: 0,
        fare: 0,
        house: 0,
        bills: 0,
        load: 0,
        shopping: 0,
        other: 0,
      },
    )
    const fixedExpenseItems = budgetData.settings.fixedExpenses
      .map((expense) => ({
        id: expense.id,
        name: expense.name || 'Unnamed bill',
        amount: getFixedExpenseAmountForCutoff(expense, previewCutoffId),
      }))
      .filter((expense) => expense.amount > 0)
    const payrollItems = budgetData.settings.payrollDeductions
      .filter(
        (deduction) =>
          deduction.enabled && (!deduction.cutoffId || deduction.cutoffId === previewCutoffId),
      )
      .map((deduction) => ({
        id: deduction.id,
        label: deduction.label,
        amount: deduction.amount,
      }))
    const housingAmount = getHousingAmountForCutoff(
      budgetData.settings.housingPlan,
      budgetData.settings.cutoffs,
      previewCutoffId,
    )
    const committedCost =
      summary.totalExpenses +
      summary.totalFixedExpenses +
      summary.totalPayrollDeductions +
      summary.totalHousingCost

    return {
      cutoff,
      summary,
      cutoffRange,
      monthLabel: new Date().toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
      variableExpenses,
      categoryTotals: Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category: category as ExpenseCategory,
          amount,
        }))
        .filter((item) => item.amount > 0)
        .sort((left, right) => right.amount - left.amount),
      fixedExpenseItems,
      payrollItems,
      housingAmount,
      committedCost,
      remainingBeforeCarryover: summary.totalIncome - committedCost,
    }
  }, [
    budgetData.expenses,
    budgetData.settings.cutoffs,
    budgetData.settings.fixedExpenses,
    budgetData.settings.housingPlan,
    budgetData.settings.payrollDeductions,
    previewCutoffId,
    snapshot.cutoffSummaries,
  ])

  const totalTrackedCutoffExpenses = cutoffCards.reduce((sum, cutoff) => sum + cutoff.totalExpenses, 0)
  const currentMonthExpenseTotal = budgetData.expenses.reduce((sum, expense) => {
    if (!isDateInSameMonth(expense.createdAt, new Date())) {
      return sum
    }

    return sum + expense.amount
  }, 0)
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
                {toCurrency(currentMonthExpenseTotal - totalTrackedCutoffExpenses)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Current-month expenses saved without a matched cutoff period.
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Cutoff cost preview
                </p>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  See the gastos already taken from one cutoff before adding carryover. This keeps
                  actual spending, recurring costs, and wallet carryover separated.
                </p>
              </div>
              <label className="w-full space-y-2 lg:max-w-sm">
                <span className="text-sm font-medium text-foreground">Preview cutoff</span>
                <select
                  value={previewCutoffId}
                  onChange={(event) => setPreviewCutoffId(event.target.value)}
                  className="ui-input"
                >
                  {cutoffCards.map((cutoff) => (
                    <option key={cutoff.id} value={cutoff.id}>
                      {cutoff.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!cutoffCostPreview ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                Pick an active cutoff to preview its costs.
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-muted/50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Actual gastos
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                      {toCurrency(cutoffCostPreview.summary.totalExpenses)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {cutoffCostPreview.variableExpenses.length} saved deduction(s) in{' '}
                      {cutoffCostPreview.monthLabel}. Rule dates:{' '}
                      {cutoffCostPreview.cutoffRange.start.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {cutoffCostPreview.cutoffRange.end.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Fixed and payroll
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                      {toCurrency(
                        cutoffCostPreview.summary.totalFixedExpenses +
                          cutoffCostPreview.summary.totalPayrollDeductions,
                      )}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Bills and salary deductions assigned here
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Total cost before carryover
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                      {toCurrency(cutoffCostPreview.committedCost)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Gastos plus recurring cutoff costs
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-300/70 bg-emerald-50/70 px-4 py-4 dark:border-emerald-800/70 dark:bg-emerald-950/20">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Carryover impact
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                      {toCurrency(cutoffCostPreview.summary.carryoverAmount)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Before: {toCurrency(cutoffCostPreview.remainingBeforeCarryover)} | After:{' '}
                      {toCurrency(cutoffCostPreview.summary.remainingBudget)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                      <p className="font-semibold text-foreground">Cost breakdown</p>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Income in cutoff</span>
                          <span className="font-medium text-foreground">
                            {toCurrency(cutoffCostPreview.summary.totalIncome)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Actual gastos</span>
                          <span className="font-medium text-foreground">
                            {toCurrency(cutoffCostPreview.summary.totalExpenses)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Fixed bills</span>
                          <span className="font-medium text-foreground">
                            {toCurrency(cutoffCostPreview.summary.totalFixedExpenses)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Payroll deductions</span>
                          <span className="font-medium text-foreground">
                            {toCurrency(cutoffCostPreview.summary.totalPayrollDeductions)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Housing allocation</span>
                          <span className="font-medium text-foreground">
                            {toCurrency(cutoffCostPreview.housingAmount)}
                          </span>
                        </div>
                        <div className="border-t border-border pt-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-foreground">Total cost taken</span>
                            <span className="font-semibold text-foreground">
                              {toCurrency(cutoffCostPreview.committedCost)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                      <p className="font-semibold text-foreground">Gastos by category</p>
                      <div className="mt-3 space-y-2">
                        {cutoffCostPreview.categoryTotals.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No actual gastos recorded for this cutoff yet.
                          </p>
                        ) : (
                          cutoffCostPreview.categoryTotals.map((item) => (
                            <div
                              key={item.category}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="text-muted-foreground">
                                {categoryLabels[item.category]}
                              </span>
                              <span className="font-medium text-foreground">
                                {toCurrency(item.amount)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                      <p className="font-semibold text-foreground">Recurring items in this cutoff</p>
                      <div className="mt-3 space-y-2">
                        {cutoffCostPreview.fixedExpenseItems.length === 0 &&
                        cutoffCostPreview.payrollItems.length === 0 &&
                        cutoffCostPreview.housingAmount <= 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No fixed bills, payroll deductions, or housing costs are assigned here.
                          </p>
                        ) : (
                          <>
                            {cutoffCostPreview.fixedExpenseItems.map((expense) => (
                              <div
                                key={expense.id}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="text-muted-foreground">{expense.name}</span>
                                <span className="font-medium text-foreground">
                                  {toCurrency(expense.amount)}
                                </span>
                              </div>
                            ))}
                            {cutoffCostPreview.payrollItems.map((deduction) => (
                              <div
                                key={deduction.id}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="text-muted-foreground">{deduction.label}</span>
                                <span className="font-medium text-foreground">
                                  {toCurrency(deduction.amount)}
                                </span>
                              </div>
                            ))}
                            {cutoffCostPreview.housingAmount > 0 && (
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-muted-foreground">
                                  {budgetData.settings.housingPlan.name || 'Housing payment'}
                                </span>
                                <span className="font-medium text-foreground">
                                  {toCurrency(cutoffCostPreview.housingAmount)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                      <p className="font-semibold text-foreground">Saved gastos in this cutoff</p>
                      <div className="mt-3 max-h-[19rem] space-y-2 overflow-y-auto pr-1">
                        {cutoffCostPreview.variableExpenses.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No expense entries are tagged to this cutoff yet.
                          </p>
                        ) : (
                          cutoffCostPreview.variableExpenses.map((expense) => (
                            <div key={expense.id} className="rounded-xl bg-card px-3 py-3 text-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {categoryLabels[expense.category]}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {expense.note || 'No note'}
                                  </p>
                                </div>
                                <p className="font-semibold text-foreground">
                                  {toCurrency(expense.amount)}
                                </p>
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {new Date(expense.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
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
                            Total cost
                          </p>
                          <p className="mt-1 font-semibold">
                            {toCurrency(cutoff.committedCost)}
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

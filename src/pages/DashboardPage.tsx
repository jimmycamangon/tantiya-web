import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBudgetStore } from '@/hooks/useBudgetStore'

export default function DashboardPage() {
  const { budgetData, snapshot } = useBudgetStore()
  const isCutoffMode = budgetData.settings.viewMode === 'cutoff'
  const [cutoffView, setCutoffView] = useState<'current' | string>('current')
  const configuredCutoffIncomeTotal = budgetData.settings.cutoffs
    .filter((cutoff) => cutoff.isActive)
    .reduce((sum, cutoff) => sum + (cutoff.expectedIncomeAmount ?? 0), 0)
  const allowanceDisplayAmount = budgetData.settings.allowancePlan.enabled
    ? isCutoffMode && budgetData.settings.allowancePlan.frequency === 'per-cutoff'
      ? budgetData.settings.allowancePlan.amount * budgetData.settings.cutoffs.filter((cutoff) => cutoff.isActive).length
      : budgetData.settings.allowancePlan.amount
    : 0
  const focusedCutoffSummary = isCutoffMode
    ? cutoffView === 'current'
      ? snapshot.currentCutoff
        ? snapshot.cutoffSummaries.find((cutoff) => cutoff.cutoffId === snapshot.currentCutoff?.id)
        : undefined
      : snapshot.cutoffSummaries.find((cutoff) => cutoff.cutoffId === cutoffView)
    : undefined
  const scopedTotals = isCutoffMode && focusedCutoffSummary
    ? {
        totalIncome: focusedCutoffSummary.totalIncome,
        totalFixedExpenses:
          focusedCutoffSummary.totalFixedExpenses + focusedCutoffSummary.totalPayrollDeductions,
        totalHousingCost: focusedCutoffSummary.totalHousingCost,
        totalVariableExpenses: focusedCutoffSummary.totalExpenses,
        savingsBuffer: 0,
        remainingBudget: focusedCutoffSummary.remainingBudget,
      }
    : isCutoffMode
      ? snapshot.currentPeriodTotals
      : snapshot.totals

  useEffect(() => {
    if (!isCutoffMode) {
      setCutoffView('current')
      return
    }

    if (
      cutoffView !== 'current' &&
      !snapshot.cutoffSummaries.some((cutoff) => cutoff.cutoffId === cutoffView)
    ) {
      setCutoffView('current')
    }
  }, [cutoffView, isCutoffMode, snapshot.cutoffSummaries])

  const currentCutoffLabel = isCutoffMode
    ? cutoffView === 'current'
      ? snapshot.currentCutoff
        ? `${snapshot.currentCutoff.label} (${snapshot.currentCutoff.startDay}-${snapshot.currentCutoff.endDay})`
        : 'Not set'
      : focusedCutoffSummary
        ? `${focusedCutoffSummary.label} (${focusedCutoffSummary.rangeLabel})`
        : 'Not set'
    : 'Monthly cycle'

  const summaryCards = useMemo(
    () => [
      [
        'Remaining budget',
        `PHP ${scopedTotals.remainingBudget.toLocaleString()}`,
        isCutoffMode
          ? 'Focused cutoff remaining after its assigned expenses and recurring cutoff bills.'
          : 'After fixed expenses, housing cost, reserved savings, and logged gastos.',
      ],
      [
        isCutoffMode ? 'Current cutoff' : 'Budget cycle',
        currentCutoffLabel,
        isCutoffMode
          ? cutoffView === 'current'
            ? snapshot.currentCutoff
              ? 'Tantiya matched today to your active cutoff range.'
              : 'Define cutoff rules in Budget Setup for proper grouping.'
            : 'You are inspecting a specific cutoff period.'
          : 'This budget is being tracked as one whole month.',
      ],
      [
        'Allowance',
        `PHP ${allowanceDisplayAmount.toLocaleString()}`,
        !budgetData.settings.allowancePlan.enabled
          ? 'No optional allowance is enabled.'
          : isCutoffMode && budgetData.settings.allowancePlan.frequency === 'per-cutoff'
            ? 'Allowance is added to each active cutoff.'
            : isCutoffMode
              ? 'Monthly allowance is distributed across your active cutoffs.'
              : 'Allowance is added to the monthly budget.',
      ],
      [
        'Reserved savings',
        `PHP ${budgetData.settings.savingsBuffer.toLocaleString()}`,
        isCutoffMode
          ? 'Reserved savings stays as a monthly reference while the main budget card focuses on the current cutoff.'
          : 'This amount is protected from your spendable budget.',
      ],
      [
        'Fixed expenses',
        `PHP ${scopedTotals.totalFixedExpenses.toLocaleString()}`,
        isCutoffMode
          ? 'Recurring expenses and payroll deductions currently applied to the focused cutoff.'
          : `${budgetData.settings.fixedExpenses.filter((expense) => expense.isActive).length} active recurring item(s), plus enabled payroll deductions.`,
      ],
      [
        'Housing payment',
        `PHP ${(isCutoffMode ? scopedTotals.totalHousingCost : snapshot.totals.totalHousingCost).toLocaleString()}`,
        budgetData.settings.housingPlan.enabled
          ? isCutoffMode && budgetData.settings.housingPlan.budgetApplication !== 'whole-month'
            ? 'Housing is being applied directly to the focused cutoff budget.'
            : `Current phase: ${budgetData.settings.housingPlan.phase}.`
          : 'Housing plan is not enabled yet.',
      ],
      [
        isCutoffMode ? 'Configured cutoffs' : 'Tracking mode',
        isCutoffMode
          ? `${budgetData.settings.cutoffs.filter((cutoff) => cutoff.isActive).length}`
          : 'Monthly',
        isCutoffMode
          ? 'Active payroll periods ready for comparison and tracking.'
          : 'Cutoff grouping is turned off for this setup.',
      ],
    ],
    [allowanceDisplayAmount, budgetData.settings, currentCutoffLabel, cutoffView, isCutoffMode, scopedTotals, snapshot],
  )

  return (
    <section className="space-y-6">
      <div className="surface-card rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(244,240,224,0.12))] p-6 shadow-[0_20px_60px_rgba(75,85,56,0.12)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(163,163,163,0.01))] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-emerald-800 dark:text-emerald-300">
          Dashboard overview
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">
          Your Tantiya workspace is ready.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          Your dashboard is now reading from the setup data saved in local storage. As you build
          out quick deduct and budget tracking, this page will become your real-time budget pulse.
          {isCutoffMode
            ? ' In cutoff mode, the main balance can focus on the currently active cutoff or any cutoff you choose below.'
            : ''}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/setup" className="public-outline-button px-5">
            Edit setup
          </Link>
          <Link to="/quick-deduct" className="public-primary-button px-5">
            Open quick deduct
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map(([title, value, body]) => (
          <article
            key={title}
            className="surface-card rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] p-5 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">{title}</p>
            <p className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">{value}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
          </article>
        ))}
      </div>

      {isCutoffMode && snapshot.cutoffSummaries.length > 0 && (
        <section className="surface-card rounded-[1.75rem] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                Cutoff focus
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep the dashboard on the current cutoff or inspect a specific period like first or second cutoff.
              </p>
            </div>
            <label className="w-full md:max-w-sm space-y-2">
              <span className="text-sm font-medium text-foreground">View budget for</span>
              <select
                value={cutoffView}
                onChange={(event) => setCutoffView(event.target.value)}
                className="ui-input"
              >
                <option value="current">Current cutoff</option>
                {snapshot.cutoffSummaries.map((cutoff) => (
                  <option key={cutoff.cutoffId} value={cutoff.cutoffId}>
                    {cutoff.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="surface-card rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
            Current setup snapshot
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-muted/50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {isCutoffMode ? 'Configured cutoff income' : 'Monthly income target'}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                PHP {(isCutoffMode ? configuredCutoffIncomeTotal : budgetData.settings.monthlyIncomeTarget).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl bg-muted/50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Logged gastos
              </p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                PHP {scopedTotals.totalVariableExpenses.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl bg-muted/50 px-4 py-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Housing plan
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {budgetData.settings.housingPlan.enabled
                  ? `${budgetData.settings.housingPlan.name} (${budgetData.settings.housingPlan.phase})`
                  : 'No housing plan configured yet'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {budgetData.settings.housingPlan.enabled
                  ? `Equity: PHP ${budgetData.settings.housingPlan.equityAmount.toLocaleString()} | Amortization: PHP ${budgetData.settings.housingPlan.amortizationAmount.toLocaleString()}`
                  : 'Enable this in setup if you want Tantiya to include house equity or amortization in the budget math.'}
              </p>
            </div>
          </div>
        </section>

        <section className="surface-card rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
            {isCutoffMode ? 'Active cutoffs' : 'Budget cycle'}
          </p>
          <div className="mt-4 space-y-3">
            {!isCutoffMode ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                Monthly mode is active, so Tantiya is tracking one full-month budget instead of
                payroll cutoffs.
              </div>
            ) : snapshot.cutoffSummaries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                No active cutoffs configured yet.
              </div>
            ) : (
              snapshot.cutoffSummaries.map((cutoff) => (
                <div key={cutoff.cutoffId} className="rounded-2xl bg-muted/50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{cutoff.label}</p>
                    <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                      Days {cutoff.rangeLabel}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Income
                      </p>
                      <p className="mt-1 font-semibold text-foreground">
                        PHP {cutoff.totalIncome.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Expenses
                      </p>
                      <p className="mt-1 font-semibold text-foreground">
                        PHP {cutoff.totalExpenses.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Remaining
                      </p>
                      <p className="mt-1 font-semibold text-foreground">
                        PHP {cutoff.remainingBudget.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

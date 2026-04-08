import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCutoffCycleKey,
  getCutoffRangeForDate,
  getMonthCycleKey,
} from '@/features/budget/calculations'
import { useBudgetStore } from '@/hooks/useBudgetStore'

const toCurrency = (value: number) => `PHP ${value.toLocaleString()}`

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatShortDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export default function DashboardPage() {
  const {
    budgetData,
    snapshot,
    cycleNotice,
    dismissCycleNotice,
    markFixedExpensePaid,
    unmarkFixedExpensePaid,
  } = useBudgetStore()
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

  const billStatusItems = useMemo(() => {
    const today = new Date()
    const reminderCutoff =
      isCutoffMode && focusedCutoffSummary
        ? budgetData.settings.cutoffs.find((cutoff) => cutoff.id === focusedCutoffSummary.cutoffId)
        : snapshot.currentCutoff

    return budgetData.settings.fixedExpenses
      .filter((expense) => expense.isActive)
      .filter((expense) => {
        if (!isCutoffMode) {
          return expense.budgetApplication === 'whole-month'
        }

        if (!reminderCutoff) {
          return false
        }

        if (expense.budgetApplication === 'whole-month') {
          return false
        }

        if (expense.budgetApplication === 'specific-cutoff') {
          return expense.cutoffId === reminderCutoff.id
        }

        return expense.budgetApplication === 'every-cutoff'
      })
      .map((expense) => {
        const cycleKey =
          isCutoffMode && reminderCutoff
            ? getCutoffCycleKey(reminderCutoff, today)
            : getMonthCycleKey(today)
        const paymentRecord = budgetData.fixedExpensePayments.find(
          (record) => record.fixedExpenseId === expense.id && record.cycleKey === cycleKey,
        )
        const dueDay =
          isCutoffMode && reminderCutoff && expense.budgetApplication === 'every-cutoff'
            ? expense.cutoffDueDays?.[reminderCutoff.id]
            : expense.dueDay

        return {
          expense,
          cycleKey,
          cutoffId: isCutoffMode ? reminderCutoff?.id : undefined,
          isPaid: Boolean(paymentRecord),
          paidAt: paymentRecord?.markedPaidAt,
          dueDay,
        }
      })
  }, [budgetData.fixedExpensePayments, budgetData.settings.cutoffs, budgetData.settings.fixedExpenses, focusedCutoffSummary, isCutoffMode, snapshot.currentCutoff])

  const reminders = useMemo(() => {
    const items: Array<{
      id: string
      tone: 'info' | 'warning'
      title: string
      body: string
      meta?: string
    }> = []
    const today = new Date()
    const reminderCutoff =
      isCutoffMode && focusedCutoffSummary
        ? budgetData.settings.cutoffs.find((cutoff) => cutoff.id === focusedCutoffSummary.cutoffId)
        : snapshot.currentCutoff

    if (isCutoffMode && reminderCutoff) {
      const currentCutoffRange = getCutoffRangeForDate(today, reminderCutoff)
      const periodEndDate = currentCutoffRange.end
      const payoutDate = addDays(periodEndDate, reminderCutoff.expectedPayoutOffsetDays ?? 0)
      const daysUntilPayout = Math.ceil(
        (new Date(payoutDate.getFullYear(), payoutDate.getMonth(), payoutDate.getDate()).getTime() -
          new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
          86400000,
      )
      const hasActualIncomeForCutoff = budgetData.incomes.some(
        (income) => income.cutoffId === reminderCutoff.id,
      )

      items.push({
        id: `payout-${reminderCutoff.id}`,
        tone: daysUntilPayout <= 3 ? 'warning' : 'info',
        title: `${reminderCutoff.label} payout reminder`,
        body: `Expected income is ${toCurrency(
          reminderCutoff.expectedIncomeAmount ?? 0,
        )} with payout target on ${formatShortDate(payoutDate)}.`,
        meta:
          daysUntilPayout < 0
            ? `${Math.abs(daysUntilPayout)} day(s) past expected payout`
            : daysUntilPayout === 0
              ? 'Expected today'
              : `${daysUntilPayout} day(s) until payout`,
      })

      if (!hasActualIncomeForCutoff) {
        items.push({
          id: `income-missing-${reminderCutoff.id}`,
          tone: 'warning',
          title: `No actual income logged for ${reminderCutoff.label}`,
          body: 'Add the salary you really received in the Income page so the budget uses actual payroll instead of only setup values.',
          meta: 'Recommended after payout arrives',
        })
      }

      const recurringCount = budgetData.settings.fixedExpenses.filter(
        (expense) =>
          expense.isActive &&
          (expense.budgetApplication === 'every-cutoff' ||
            (expense.budgetApplication === 'specific-cutoff' &&
              expense.cutoffId === reminderCutoff.id)),
      ).length
      const dueSoonBill = budgetData.settings.fixedExpenses.find((expense) => {
        if (!expense.isActive) {
          return false
        }

        if (expense.budgetApplication === 'specific-cutoff' && expense.cutoffId !== reminderCutoff.id) {
          return false
        }

        const relevantDueDay =
          expense.budgetApplication === 'every-cutoff'
            ? expense.cutoffDueDays?.[reminderCutoff.id]
            : expense.dueDay

        if (!relevantDueDay) {
          return false
        }

        const cycleKey = getCutoffCycleKey(reminderCutoff, today)

        const isPaid = budgetData.fixedExpensePayments.some(
          (record) => record.fixedExpenseId === expense.id && record.cycleKey === cycleKey,
        )

        if (isPaid) {
          return false
        }

        if (expense.budgetApplication === 'whole-month') {
          return Math.abs(relevantDueDay - today.getDate()) <= 3
        }

        return Math.abs(relevantDueDay - today.getDate()) <= 3
      })
      const payrollDeductionCount = budgetData.settings.payrollDeductions.filter(
        (deduction) =>
          deduction.enabled && (!deduction.cutoffId || deduction.cutoffId === reminderCutoff.id),
      ).length
      const hasHousingOnFocusedCutoff =
        budgetData.settings.housingPlan.enabled &&
        (budgetData.settings.housingPlan.budgetApplication === 'split-across-cutoffs' ||
          (budgetData.settings.housingPlan.budgetApplication === 'specific-cutoff' &&
            budgetData.settings.housingPlan.cutoffId === reminderCutoff.id))

      if (recurringCount > 0 || payrollDeductionCount > 0 || hasHousingOnFocusedCutoff) {
        items.push({
          id: `obligations-${reminderCutoff.id}`,
          tone: 'info',
          title: `${reminderCutoff.label} recurring obligations`,
          body: `${recurringCount} fixed bill(s), ${payrollDeductionCount} payroll deduction(s), and ${
            hasHousingOnFocusedCutoff ? 'housing is included' : 'no housing allocation'
          } in this cutoff budget.`,
          meta: 'Review setup if one item should move to another cutoff',
        })
      }

      if (dueSoonBill) {
        const dueSoonBillDay =
          dueSoonBill.budgetApplication === 'every-cutoff'
            ? dueSoonBill.cutoffDueDays?.[reminderCutoff.id]
            : dueSoonBill.dueDay
        items.push({
          id: `bill-due-${dueSoonBill.id}`,
          tone: 'warning',
          title: `${dueSoonBill.name || 'Recurring bill'} is due soon`,
          body: `${toCurrency(dueSoonBill.amount)} is scheduled around day ${dueSoonBillDay} based on your recurring bill setup.`,
          meta: 'Review or pay soon',
        })
      }
    } else if (!isCutoffMode) {
      const hasActualIncome = budgetData.incomes.length > 0

      if (!hasActualIncome) {
        items.push({
          id: 'monthly-income-missing',
          tone: 'warning',
          title: 'No actual income logged this month',
          body: 'Your budget is currently relying on the monthly target from setup. Add a real income entry when salary arrives.',
          meta: 'Income page',
        })
      }

      if (budgetData.settings.fixedExpenses.some((expense) => expense.isActive)) {
        items.push({
          id: 'monthly-bills',
          tone: 'info',
          title: 'Recurring bills are active this month',
          body: `${budgetData.settings.fixedExpenses.filter((expense) => expense.isActive).length} fixed expense item(s) are already reducing your monthly budget.`,
          meta: 'Check Budget Setup for changes',
        })
      }

      const dueSoonMonthlyBill = budgetData.settings.fixedExpenses.find(
        (expense) => {
          if (!expense.isActive || !expense.dueDay) {
            return false
          }

          const cycleKey = getMonthCycleKey(today)
          const isPaid = budgetData.fixedExpensePayments.some(
            (record) => record.fixedExpenseId === expense.id && record.cycleKey === cycleKey,
          )

          if (isPaid) {
            return false
          }

          return Math.abs(expense.dueDay - today.getDate()) <= 3
        },
      )

      if (dueSoonMonthlyBill) {
        items.push({
          id: `monthly-bill-due-${dueSoonMonthlyBill.id}`,
          tone: 'warning',
          title: `${dueSoonMonthlyBill.name || 'Recurring bill'} is due soon`,
          body: `${toCurrency(dueSoonMonthlyBill.amount)} is scheduled around day ${dueSoonMonthlyBill.dueDay} in your monthly plan.`,
          meta: 'Review or pay soon',
        })
      }
    }

    if (budgetData.settings.allowancePlan.enabled && budgetData.incomes.length === 0) {
      items.push({
        id: 'allowance-setup',
        tone: 'info',
        title: 'Allowance is configured in setup',
        body: 'If your company gives allowance separately, you can also log it as an actual income entry once it is received.',
        meta: 'Optional but helpful for accuracy',
      })
    }

    return items.slice(0, 4)
  }, [budgetData.fixedExpensePayments, budgetData.incomes, budgetData.settings, focusedCutoffSummary, isCutoffMode, snapshot.currentCutoff])

  const warningReminders = reminders.filter((reminder) => reminder.tone === 'warning').length
  const unpaidBillCount = billStatusItems.filter((item) => !item.isPaid).length
  const focusCards = useMemo(
    () => [
      {
        title: isCutoffMode ? 'Live cutoff' : 'Live month',
        value: currentCutoffLabel,
        tone: 'emerald',
      },
      {
        title: 'Urgent reminders',
        value: `${warningReminders}`,
        tone: warningReminders > 0 ? 'amber' : 'stone',
      },
      {
        title: 'Unpaid bills',
        value: `${unpaidBillCount}`,
        tone: unpaidBillCount > 0 ? 'amber' : 'stone',
      },
      {
        title: 'Logged gastos',
        value: toCurrency(scopedTotals.totalVariableExpenses),
        tone: 'stone',
      },
    ],
    [currentCutoffLabel, isCutoffMode, scopedTotals.totalVariableExpenses, unpaidBillCount, warningReminders],
  )

  const summaryCards = useMemo(
    () => [
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
      <div className="surface-card rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,251,240,0.82),rgba(245,238,221,0.52))] p-6 shadow-[0_18px_48px_rgba(75,85,56,0.1)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(163,163,163,0.01))] sm:p-8">
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

        {cycleNotice && (
          <div className="mt-6 rounded-2xl border border-emerald-300/70 bg-emerald-50/80 px-4 py-4 dark:border-emerald-800/70 dark:bg-emerald-950/20">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-foreground">New budget cycle detected</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Tantiya moved from {cycleNotice.previousLabel} to {cycleNotice.nextLabel} and is now using{' '}
                  {cycleNotice.nextRangeLabel} as the active live cycle.
                </p>
              </div>
              <button type="button" onClick={dismissCycleNotice} className="ui-button-subtle">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <article className="surface-card rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(5,150,105,0.2),rgba(248,244,232,0.72))] p-6 shadow-[0_20px_46px_rgba(5,150,105,0.1)] dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(255,255,255,0.03))] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800 dark:text-emerald-300">
            Live budget
          </p>
          <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-4xl font-bold tracking-[-0.06em] text-foreground sm:text-5xl">
                {toCurrency(scopedTotals.remainingBudget)}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isCutoffMode
                  ? 'This is the remaining budget for the active focused cutoff after its assigned bills, payroll deductions, housing allocation, and logged gastos.'
                  : 'This is your remaining whole-month budget after recurring obligations, housing, reserved savings, and logged gastos.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[23rem] xl:flex-none">
              <div className="rounded-2xl border border-emerald-200/70 bg-[rgba(255,251,244,0.74)] px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Income in view</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {toCurrency(scopedTotals.totalIncome)}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200/70 bg-[rgba(255,251,244,0.74)] px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Committed costs</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {toCurrency(
                    scopedTotals.totalFixedExpenses +
                      scopedTotals.totalHousingCost +
                      scopedTotals.totalVariableExpenses,
                  )}
                </p>
              </div>
            </div>
          </div>
        </article>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {focusCards.map((card) => (
            <article key={card.title} className="surface-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {card.title}
              </p>
              <p
                className={[
                  'mt-3 text-2xl font-bold tracking-[-0.05em]',
                  card.tone === 'emerald'
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : card.tone === 'amber'
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-foreground',
                ].join(' ')}
              >
                {card.value}
              </p>
            </article>
          ))}
        </section>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map(([title, value, body]) => (
          <article
            key={title}
            className="surface-card rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,252,246,0.78),rgba(244,239,226,0.42))] p-5 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]"
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

      <section className="surface-card rounded-[1.75rem] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Due soon
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Heads-up reminders based on your current budget cycle, payout expectations, and recurring obligations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/income" className="public-outline-button px-4">
              Open income
            </Link>
            <Link to="/setup" className="public-outline-button px-4">
              Review setup
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {reminders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              No reminder signals right now. As you add more actual income and recurring setup data, Tantiya will surface more useful heads-ups here.
            </div>
          ) : (
            reminders.map((reminder) => (
              <article
                key={reminder.id}
                className={[
                  'rounded-2xl border px-4 py-4',
                  reminder.tone === 'warning'
                    ? 'border-amber-300/80 bg-amber-50/80 dark:border-amber-800/80 dark:bg-amber-950/20'
                    : 'border-border bg-muted/50',
                ].join(' ')}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{reminder.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{reminder.body}</p>
                  </div>
                  {reminder.meta && (
                    <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                      {reminder.meta}
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="surface-card rounded-[1.75rem] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Bill status
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Mark recurring bills as paid for the current month or the focused cutoff so reminders stay accurate.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {billStatusItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              No recurring bills apply to the current period yet.
            </div>
          ) : (
            billStatusItems.map((item) => (
              <article key={`${item.expense.id}-${item.cycleKey}`} className="rounded-2xl bg-muted/50 px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{item.expense.name || 'Unnamed bill'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {toCurrency(item.expense.amount)} · {item.expense.category}
                      {item.dueDay ? ` · due around day ${item.dueDay}` : ''}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.isPaid
                        ? `Marked paid ${new Date(item.paidAt ?? '').toLocaleString()}`
                        : 'Not marked paid yet for this cycle'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      item.isPaid
                        ? unmarkFixedExpensePaid({
                            fixedExpenseId: item.expense.id,
                            cycleKey: item.cycleKey,
                          })
                        : markFixedExpensePaid({
                            fixedExpenseId: item.expense.id,
                            cycleKey: item.cycleKey,
                            cutoffId: item.cutoffId,
                          })
                    }
                    className={item.isPaid ? 'ui-button-subtle' : 'ui-button'}
                  >
                    {item.isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

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

import type {
  BudgetData,
  BudgetCycleSnapshot,
  BudgetTotals,
  CutoffDefinition,
  CutoffSummary,
  ExpenseEntry,
  FixedExpense,
  HousingPlan,
  IncomeEntry,
} from '@/types/budget'

const clampDay = (day: number) => Math.min(Math.max(Math.trunc(day), 1), 31)
const getLastDayOfMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate()
const clampDayToMonth = (year: number, month: number, day: number) =>
  Math.min(clampDay(day), getLastDayOfMonth(year, month))

export const sumAmounts = (
  items: Array<{ amount: number; isActive?: boolean }>,
): number =>
  items.reduce((total, item) => {
    if (item.isActive === false) {
      return total
    }

    return total + item.amount
  }, 0)

export const getHousingCost = (housingPlan: HousingPlan): number => {
  if (!housingPlan.enabled) {
    return 0
  }

  if (
    housingPlan.phase === 'equity' &&
    housingPlan.equityMonthsPaid < housingPlan.equityMonths
  ) {
    return housingPlan.equityAmount
  }

  return housingPlan.amortizationAmount
}

export const getHousingAmountForCutoff = (
  housingPlan: HousingPlan,
  cutoffs: CutoffDefinition[],
  cutoffId?: string,
): number => {
  const totalHousingCost = getHousingCost(housingPlan)

  if (!housingPlan.enabled || totalHousingCost <= 0 || !cutoffId) {
    return 0
  }

  if (housingPlan.budgetApplication === 'whole-month') {
    return 0
  }

  if (housingPlan.budgetApplication === 'specific-cutoff') {
    return housingPlan.cutoffId === cutoffId ? totalHousingCost : 0
  }

  const activeCutoffCount = cutoffs.filter((cutoff) => cutoff.isActive).length

  if (activeCutoffCount <= 0) {
    return 0
  }

  return totalHousingCost / activeCutoffCount
}

export const getFixedExpenseAmountForCutoff = (
  fixedExpense: FixedExpense,
  cutoffId?: string,
): number => {
  if (!fixedExpense.isActive || !cutoffId) {
    return 0
  }

  if (fixedExpense.budgetApplication === 'whole-month') {
    return 0
  }

  if (fixedExpense.budgetApplication === 'specific-cutoff') {
    return fixedExpense.cutoffId === cutoffId ? fixedExpense.amount : 0
  }

  return fixedExpense.amount
}

export const getTotalFixedExpenses = (
  fixedExpenses: FixedExpense[],
  housingPlan: HousingPlan,
): number => sumAmounts(fixedExpenses) + getHousingCost(housingPlan)

export const getTotalIncome = (incomes: IncomeEntry[]): number => sumAmounts(incomes)

export const getAllowanceIncome = (
  allowancePlan: BudgetData['settings']['allowancePlan'],
  viewMode: BudgetData['settings']['viewMode'],
): number => {
  if (!allowancePlan.enabled) {
    return 0
  }

  if (viewMode === 'cutoff' && allowancePlan.frequency === 'monthly') {
    return allowancePlan.amount
  }

  return allowancePlan.amount
}

export const getAllowanceAmountForCutoff = (
  allowancePlan: BudgetData['settings']['allowancePlan'],
  activeCutoffCount: number,
): number => {
  if (!allowancePlan.enabled || activeCutoffCount <= 0) {
    return 0
  }

  if (allowancePlan.frequency === 'per-cutoff') {
    return allowancePlan.amount
  }

  return allowancePlan.amount / activeCutoffCount
}

export const getConfiguredCutoffIncome = (cutoffs: CutoffDefinition[]): number =>
  cutoffs.reduce((sum, cutoff) => {
    if (!cutoff.isActive) {
      return sum
    }

    return sum + (cutoff.expectedIncomeAmount ?? 0)
  }, 0)

export const getPayrollDeductionTotal = (
  deductions: BudgetData['settings']['payrollDeductions'],
): number =>
  deductions.reduce((sum, deduction) => {
    if (!deduction.enabled) {
      return sum
    }

    return sum + deduction.amount
  }, 0)

export const getTotalExpenses = (expenses: ExpenseEntry[]): number =>
  sumAmounts(expenses)

export const getBudgetTotals = (budgetData: BudgetData): BudgetTotals => {
  const configuredBaseIncome =
    budgetData.incomes.length > 0
      ? getTotalIncome(budgetData.incomes)
      : budgetData.settings.viewMode === 'cutoff'
        ? getConfiguredCutoffIncome(budgetData.settings.cutoffs)
        : budgetData.settings.monthlyIncomeTarget
  const totalIncome =
    configuredBaseIncome +
    getAllowanceIncome(budgetData.settings.allowancePlan, budgetData.settings.viewMode)

  const totalFixedExpenses = budgetData.settings.fixedExpenses.reduce((sum, expense) => {
    if (!expense.isActive || expense.budgetApplication !== 'whole-month') {
      return sum
    }

    return sum + expense.amount
  }, 0)
  const totalPayrollDeductions = getPayrollDeductionTotal(budgetData.settings.payrollDeductions)
  const totalHousingCost = getHousingCost(budgetData.settings.housingPlan)
  const totalVariableExpenses = getTotalExpenses(budgetData.expenses)
  const savingsBuffer = budgetData.settings.savingsBuffer
  const remainingBudget =
    totalIncome -
    totalFixedExpenses -
    totalPayrollDeductions -
    totalHousingCost -
    totalVariableExpenses -
    savingsBuffer

  return {
    totalIncome,
    totalFixedExpenses: totalFixedExpenses + totalPayrollDeductions,
    totalHousingCost,
    totalVariableExpenses,
    savingsBuffer,
    remainingBudget,
  }
}

export const getCutoffRangeLabel = (cutoff: CutoffDefinition): string => {
  const startDay = clampDay(cutoff.startDay)
  const endDay = clampDay(cutoff.endDay)

  return `${startDay}-${endDay}`
}

export const getMonthCycleKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export const getCutoffRangeForDate = (
  date: Date,
  cutoff: CutoffDefinition,
) => {
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

export const getCutoffCycleKey = (
  cutoff: CutoffDefinition,
  date: Date,
) => {
  const range = getCutoffRangeForDate(date, cutoff)
  return `${cutoff.id}:${getMonthCycleKey(range.start)}`
}

export const getCurrentBudgetCycle = (
  budgetData: BudgetData,
  now = new Date(),
): BudgetCycleSnapshot => {
  if (budgetData.settings.viewMode === 'monthly') {
    return {
      key: getMonthCycleKey(now),
      label: now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      rangeLabel: getMonthCycleKey(now),
      type: 'monthly',
    }
  }

  const currentCutoff = getCurrentCutoff(budgetData, now)

  if (!currentCutoff) {
    return {
      key: `cutoff-unmatched:${getMonthCycleKey(now)}`,
      label: 'Unmatched cutoff',
      rangeLabel: getMonthCycleKey(now),
      type: 'cutoff',
    }
  }

  const range = getCutoffRangeForDate(now, currentCutoff)

  return {
    key: getCutoffCycleKey(currentCutoff, now),
    label: currentCutoff.label,
    rangeLabel: `${range.start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })} - ${range.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    type: 'cutoff',
  }
}

export const getCutoffForDate = (
  dateInput: string | Date,
  cutoffs: CutoffDefinition[],
): CutoffDefinition | undefined => {
  const date = new Date(dateInput)
  const day = date.getDate()

  return cutoffs.find((cutoff) => {
    if (!cutoff.isActive) {
      return false
    }

    const startDay = clampDay(cutoff.startDay)
    const endDay = clampDay(cutoff.endDay)

    if (startDay <= endDay) {
      return day >= startDay && day <= endDay
    }

    return day >= startDay || day <= endDay
  })
}

export const getCurrentCutoff = (budgetData: BudgetData, now = new Date()) =>
  budgetData.settings.viewMode === 'cutoff'
    ? budgetData.settings.cutoffs.find(
        (cutoff) =>
          cutoff.isActive && cutoff.id === budgetData.settings.activeCutoffId,
      ) ?? getCutoffForDate(now, budgetData.settings.cutoffs)
    : undefined

export const getCutoffSummaries = (budgetData: BudgetData): CutoffSummary[] =>
  budgetData.settings.viewMode !== 'cutoff'
    ? []
    : budgetData.settings.cutoffs
        .filter((cutoff) => cutoff.isActive)
        .map((cutoff) => {
          const activeCutoffCount = budgetData.settings.cutoffs.filter((item) => item.isActive).length
          const allowanceForCutoff = getAllowanceAmountForCutoff(
            budgetData.settings.allowancePlan,
            activeCutoffCount,
          )
          const totalIncome = budgetData.incomes
            .filter((income) => income.cutoffId === cutoff.id)
            .reduce((sum, income) => sum + income.amount, 0)

          const totalExpenses = budgetData.expenses
            .filter((expense) => expense.cutoffId === cutoff.id)
            .reduce((sum, expense) => sum + expense.amount, 0)

          const cutoffFixedExpenses = budgetData.settings.fixedExpenses.reduce((sum, expense) => {
            return (
              sum +
              getFixedExpenseAmountForCutoff(
                expense,
                cutoff.id,
              )
            )
          }, 0)
          const cutoffPayrollDeductions = budgetData.settings.payrollDeductions
            .filter(
              (deduction) =>
                deduction.enabled && (!deduction.cutoffId || deduction.cutoffId === cutoff.id),
            )
            .reduce((sum, deduction) => sum + deduction.amount, 0)
          const cutoffHousingCost = getHousingAmountForCutoff(
            budgetData.settings.housingPlan,
            budgetData.settings.cutoffs,
            cutoff.id,
          )
          const resolvedIncome =
            (totalIncome > 0 ? totalIncome : cutoff.expectedIncomeAmount ?? 0) + allowanceForCutoff

          return {
            cutoffId: cutoff.id,
            label: cutoff.label,
            rangeLabel: getCutoffRangeLabel(cutoff),
            totalIncome: resolvedIncome,
            totalFixedExpenses: cutoffFixedExpenses,
            totalPayrollDeductions: cutoffPayrollDeductions,
            totalHousingCost: cutoffHousingCost,
            totalExpenses,
            remainingBudget:
              resolvedIncome -
              totalExpenses -
              cutoffFixedExpenses -
              cutoffPayrollDeductions -
              cutoffHousingCost,
          }
        })

export const getCurrentBudgetSnapshot = (budgetData: BudgetData, now = new Date()) => {
  const currentCutoff = getCurrentCutoff(budgetData, now)
  const totals = getBudgetTotals(budgetData)
  const cutoffSummaries = getCutoffSummaries(budgetData)
  const currentCycle = getCurrentBudgetCycle(budgetData, now)
  const currentCutoffSummary = currentCutoff
    ? cutoffSummaries.find((cutoff) => cutoff.cutoffId === currentCutoff.id)
    : undefined

  const currentPeriodTotals =
    budgetData.settings.viewMode === 'cutoff' && currentCutoff && currentCutoffSummary
      ? {
          totalIncome: currentCutoffSummary.totalIncome,
          totalFixedExpenses:
            currentCutoffSummary.totalFixedExpenses + currentCutoffSummary.totalPayrollDeductions,
          totalHousingCost: currentCutoffSummary.totalHousingCost,
          totalVariableExpenses: currentCutoffSummary.totalExpenses,
          savingsBuffer: 0,
          remainingBudget: currentCutoffSummary.remainingBudget,
        }
      : totals

  return {
    currentCutoff,
    currentCycle,
    totals,
    currentPeriodTotals,
    cutoffSummaries,
  }
}

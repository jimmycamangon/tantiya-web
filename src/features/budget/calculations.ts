import type {
  BudgetData,
  BudgetTotals,
  CutoffDefinition,
  CutoffSummary,
  ExpenseEntry,
  FixedExpense,
  HousingPlan,
  IncomeEntry,
} from '@/types/budget'

const clampDay = (day: number) => Math.min(Math.max(Math.trunc(day), 1), 31)

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

  const totalFixedExpenses = sumAmounts(budgetData.settings.fixedExpenses)
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
    ? getCutoffForDate(now, budgetData.settings.cutoffs)
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

          const cutoffFixedExpenses = budgetData.settings.fixedExpenses
            .filter(
              (expense) => expense.isActive && (!expense.cutoffId || expense.cutoffId === cutoff.id),
            )
            .reduce((sum, expense) => sum + expense.amount, 0)
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
    totals,
    currentPeriodTotals,
    cutoffSummaries,
  }
}

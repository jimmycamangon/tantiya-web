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

export const getTotalFixedExpenses = (
  fixedExpenses: FixedExpense[],
  housingPlan: HousingPlan,
): number => sumAmounts(fixedExpenses) + getHousingCost(housingPlan)

export const getTotalIncome = (incomes: IncomeEntry[]): number => sumAmounts(incomes)

export const getTotalExpenses = (expenses: ExpenseEntry[]): number =>
  sumAmounts(expenses)

export const getBudgetTotals = (budgetData: BudgetData): BudgetTotals => {
  const totalIncome =
    budgetData.incomes.length > 0
      ? getTotalIncome(budgetData.incomes)
      : budgetData.settings.monthlyIncomeTarget

  const totalFixedExpenses = sumAmounts(budgetData.settings.fixedExpenses)
  const totalHousingCost = getHousingCost(budgetData.settings.housingPlan)
  const totalVariableExpenses = getTotalExpenses(budgetData.expenses)
  const savingsBuffer = budgetData.settings.savingsBuffer
  const remainingBudget =
    totalIncome -
    totalFixedExpenses -
    totalHousingCost -
    totalVariableExpenses -
    savingsBuffer

  return {
    totalIncome,
    totalFixedExpenses,
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
  getCutoffForDate(now, budgetData.settings.cutoffs)

export const getCutoffSummaries = (budgetData: BudgetData): CutoffSummary[] =>
  budgetData.settings.cutoffs
    .filter((cutoff) => cutoff.isActive)
    .map((cutoff) => {
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

      return {
        cutoffId: cutoff.id,
        label: cutoff.label,
        rangeLabel: getCutoffRangeLabel(cutoff),
        totalIncome,
        totalExpenses,
        remainingBudget: totalIncome - totalExpenses - cutoffFixedExpenses,
      }
    })

export const getCurrentBudgetSnapshot = (budgetData: BudgetData, now = new Date()) => {
  const currentCutoff = getCurrentCutoff(budgetData, now)
  const totals = getBudgetTotals(budgetData)

  return {
    currentCutoff,
    totals,
    cutoffSummaries: getCutoffSummaries(budgetData),
  }
}

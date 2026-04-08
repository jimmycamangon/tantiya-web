import type { BudgetData, BudgetSettings } from '@/types/budget'

export const BUDGET_STORAGE_KEY = 'tantiya:budget-data'
export const BUDGET_DATA_VERSION = 1

export const DEFAULT_QUICK_AMOUNT_PRESETS = [
  20, 50, 100, 200, 500, 1000,
].map((value) => ({
  id: `preset-${value}`,
  value,
}))

export const DEFAULT_SETTINGS: BudgetSettings = {
  currency: 'PHP',
  viewMode: 'cutoff',
  activeCutoffId: undefined,
  monthlyIncomeTarget: 0,
  savingsBuffer: 0,
  allowancePlan: {
    enabled: false,
    amount: 0,
    frequency: 'monthly',
    label: 'Allowance',
  },
  payrollDeductions: [
    { id: 'deduction-sss', type: 'sss', label: 'SSS', amount: 0, enabled: false },
    { id: 'deduction-pagibig', type: 'pagibig', label: 'Pag-IBIG', amount: 0, enabled: false },
    { id: 'deduction-philhealth', type: 'philhealth', label: 'PhilHealth', amount: 0, enabled: false },
    { id: 'deduction-wtax', type: 'wtax', label: 'WTax', amount: 0, enabled: false },
  ],
  fixedExpenses: [],
  housingPlan: {
    enabled: false,
    name: 'Housing payment',
    phase: 'equity',
    budgetApplication: 'whole-month',
    equityAmount: 0,
    equityMonths: 30,
    equityMonthsPaid: 0,
    amortizationAmount: 0,
  },
  cutoffs: [
    {
      id: 'cutoff-a',
      label: 'First cutoff',
      startDay: 1,
      endDay: 15,
      expectedIncomeAmount: 0,
      expectedPayoutOffsetDays: 10,
      isActive: true,
    },
    {
      id: 'cutoff-b',
      label: 'Second cutoff',
      startDay: 16,
      endDay: 31,
      expectedIncomeAmount: 0,
      expectedPayoutOffsetDays: 15,
      isActive: true,
    },
  ],
  quickAmountPresets: DEFAULT_QUICK_AMOUNT_PRESETS,
}

export const createEmptyBudgetData = (): BudgetData => {
  const now = new Date().toISOString()

  return {
    version: BUDGET_DATA_VERSION,
    createdAt: now,
    updatedAt: now,
    lifecycle: {},
    settings: DEFAULT_SETTINGS,
    incomes: [],
    expenses: [],
    fixedExpensePayments: [],
  }
}

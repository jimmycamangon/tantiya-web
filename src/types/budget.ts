export type CurrencyCode = 'PHP'

export type BudgetViewMode = 'monthly' | 'cutoff'

export type HousingPaymentPhase = 'equity' | 'amortization'
export type HousingBudgetApplication =
  | 'whole-month'
  | 'split-across-cutoffs'
  | 'specific-cutoff'
export type AllowanceFrequency = 'monthly' | 'per-cutoff'
export type PayrollDeductionType = 'sss' | 'pagibig' | 'philhealth' | 'wtax'

export type ExpenseCategory =
  | 'food'
  | 'fare'
  | 'house'
  | 'bills'
  | 'load'
  | 'shopping'
  | 'other'

export interface QuickAmountPreset {
  id: string
  value: number
}

export interface CutoffDefinition {
  id: string
  label: string
  startDay: number
  endDay: number
  expectedIncomeAmount: number
  expectedPayoutOffsetDays?: number
  isActive: boolean
}

export interface FixedExpense {
  id: string
  name: string
  amount: number
  category: ExpenseCategory | 'loan' | 'utilities'
  cutoffId?: string
  isActive: boolean
}

export interface HousingPlan {
  enabled: boolean
  name: string
  phase: HousingPaymentPhase
  budgetApplication: HousingBudgetApplication
  cutoffId?: string
  equityAmount: number
  equityMonths: number
  equityMonthsPaid: number
  amortizationAmount: number
  startDate?: string
}

export interface AllowancePlan {
  enabled: boolean
  amount: number
  frequency: AllowanceFrequency
  label: string
}

export interface PayrollDeduction {
  id: string
  type: PayrollDeductionType
  label: string
  amount: number
  enabled: boolean
  cutoffId?: string
}

export interface IncomeEntry {
  id: string
  label: string
  amount: number
  receivedAt: string
  cutoffId?: string
  notes?: string
}

export interface ExpenseEntry {
  id: string
  amount: number
  category: ExpenseCategory
  createdAt: string
  cutoffId?: string
  note?: string
  source: 'quick-tap' | 'manual'
}

export interface BudgetSettings {
  currency: CurrencyCode
  viewMode: BudgetViewMode
  monthlyIncomeTarget: number
  savingsBuffer: number
  allowancePlan: AllowancePlan
  payrollDeductions: PayrollDeduction[]
  fixedExpenses: FixedExpense[]
  housingPlan: HousingPlan
  cutoffs: CutoffDefinition[]
  quickAmountPresets: QuickAmountPreset[]
}

export interface BudgetData {
  version: number
  createdAt: string
  updatedAt: string
  settings: BudgetSettings
  incomes: IncomeEntry[]
  expenses: ExpenseEntry[]
}

export interface BudgetTotals {
  totalIncome: number
  totalFixedExpenses: number
  totalHousingCost: number
  totalVariableExpenses: number
  savingsBuffer: number
  remainingBudget: number
}

export interface CutoffSummary {
  cutoffId: string
  label: string
  rangeLabel: string
  totalIncome: number
  totalFixedExpenses: number
  totalPayrollDeductions: number
  totalHousingCost: number
  totalExpenses: number
  remainingBudget: number
}

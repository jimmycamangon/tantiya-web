export type CurrencyCode = 'PHP'

export type BudgetViewMode = 'monthly' | 'cutoff'

export type HousingPaymentPhase = 'equity' | 'amortization'

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
  equityAmount: number
  equityMonths: number
  equityMonthsPaid: number
  amortizationAmount: number
  startDate?: string
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
  totalExpenses: number
  remainingBudget: number
}

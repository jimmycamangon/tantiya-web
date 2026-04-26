import {
  BUDGET_DATA_VERSION,
  BUDGET_STORAGE_KEY,
  createEmptyBudgetData,
  DEFAULT_SETTINGS,
} from '@/features/budget/constants'
import type { BudgetData } from '@/types/budget'

const hasLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage

const normalizeBudgetData = (value: unknown): BudgetData => {
  if (!value || typeof value !== 'object') {
    return createEmptyBudgetData()
  }

  const raw = value as Partial<BudgetData>
  const empty = createEmptyBudgetData()

  return {
    version:
      typeof raw.version === 'number' ? raw.version : BUDGET_DATA_VERSION,
    createdAt:
      typeof raw.createdAt === 'string' ? raw.createdAt : empty.createdAt,
    updatedAt:
      typeof raw.updatedAt === 'string' ? raw.updatedAt : empty.updatedAt,
    lifecycle: {
      lastSeenCycleKey:
        typeof raw.lifecycle?.lastSeenCycleKey === 'string'
          ? raw.lifecycle.lastSeenCycleKey
          : undefined,
      lastSeenCycleLabel:
        typeof raw.lifecycle?.lastSeenCycleLabel === 'string'
          ? raw.lifecycle.lastSeenCycleLabel
          : undefined,
      lastRolloverAt:
        typeof raw.lifecycle?.lastRolloverAt === 'string'
          ? raw.lifecycle.lastRolloverAt
          : undefined,
    },
    settings: {
      ...DEFAULT_SETTINGS,
      ...raw.settings,
      activeCutoffId:
        typeof raw.settings?.activeCutoffId === 'string'
          ? raw.settings.activeCutoffId
          : undefined,
      allowancePlan: {
        ...DEFAULT_SETTINGS.allowancePlan,
        ...raw.settings?.allowancePlan,
      },
      cutoffCarryoverPlan: {
        ...DEFAULT_SETTINGS.cutoffCarryoverPlan,
        ...raw.settings?.cutoffCarryoverPlan,
        amount:
          typeof raw.settings?.cutoffCarryoverPlan?.amount === 'number'
            ? raw.settings.cutoffCarryoverPlan.amount
            : 0,
        cutoffId:
          typeof raw.settings?.cutoffCarryoverPlan?.cutoffId === 'string'
            ? raw.settings.cutoffCarryoverPlan.cutoffId
            : undefined,
        note:
          typeof raw.settings?.cutoffCarryoverPlan?.note === 'string'
            ? raw.settings.cutoffCarryoverPlan.note
            : '',
      },
      payrollDeductions: Array.isArray(raw.settings?.payrollDeductions)
        ? raw.settings.payrollDeductions.map((deduction, index) => ({
            ...DEFAULT_SETTINGS.payrollDeductions[index % DEFAULT_SETTINGS.payrollDeductions.length],
            ...deduction,
            amount: typeof deduction?.amount === 'number' ? deduction.amount : 0,
            enabled: typeof deduction?.enabled === 'boolean' ? deduction.enabled : false,
          }))
        : DEFAULT_SETTINGS.payrollDeductions,
      housingPlan: {
        ...DEFAULT_SETTINGS.housingPlan,
        ...raw.settings?.housingPlan,
        cutoffId:
          typeof raw.settings?.housingPlan?.cutoffId === 'string'
            ? raw.settings.housingPlan.cutoffId
            : undefined,
      },
      fixedExpenses: Array.isArray(raw.settings?.fixedExpenses)
        ? raw.settings.fixedExpenses.map((expense) => ({
            ...expense,
            budgetApplication:
              expense?.budgetApplication === 'every-cutoff' ||
              expense?.budgetApplication === 'specific-cutoff'
                ? expense.budgetApplication
                : 'whole-month',
            amount: typeof expense?.amount === 'number' ? expense.amount : 0,
            dueDay: typeof expense?.dueDay === 'number' ? expense.dueDay : undefined,
            cutoffDueDays:
              expense?.cutoffDueDays && typeof expense.cutoffDueDays === 'object'
                ? Object.fromEntries(
                    Object.entries(expense.cutoffDueDays).filter(
                      ([key, value]) => typeof key === 'string' && typeof value === 'number',
                    ),
                  )
                : undefined,
          }))
        : [],
      cutoffs: Array.isArray(raw.settings?.cutoffs)
        ? raw.settings.cutoffs.map((cutoff, index) => ({
            ...DEFAULT_SETTINGS.cutoffs[index % DEFAULT_SETTINGS.cutoffs.length],
            ...cutoff,
            expectedIncomeAmount:
              typeof cutoff?.expectedIncomeAmount === 'number' ? cutoff.expectedIncomeAmount : 0,
          }))
        : DEFAULT_SETTINGS.cutoffs,
      quickAmountPresets: Array.isArray(raw.settings?.quickAmountPresets)
        ? raw.settings.quickAmountPresets
        : DEFAULT_SETTINGS.quickAmountPresets,
    },
    incomes: Array.isArray(raw.incomes) ? raw.incomes : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
    fixedExpensePayments: Array.isArray(raw.fixedExpensePayments)
      ? raw.fixedExpensePayments.filter(
          (record) =>
            typeof record?.id === 'string' &&
            typeof record?.fixedExpenseId === 'string' &&
            typeof record?.cycleKey === 'string' &&
            typeof record?.markedPaidAt === 'string',
        )
      : [],
  }
}

export const readBudgetData = (): BudgetData => {
  if (!hasLocalStorage()) {
    return createEmptyBudgetData()
  }

  const rawValue = window.localStorage.getItem(BUDGET_STORAGE_KEY)

  if (!rawValue) {
    return createEmptyBudgetData()
  }

  try {
    return normalizeBudgetData(JSON.parse(rawValue))
  } catch {
    return createEmptyBudgetData()
  }
}

export const writeBudgetData = (budgetData: BudgetData): BudgetData => {
  const normalized = normalizeBudgetData({
    ...budgetData,
    updatedAt: new Date().toISOString(),
  })

  if (hasLocalStorage()) {
    window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}

export const resetBudgetData = (): BudgetData => {
  const empty = createEmptyBudgetData()
  return writeBudgetData(empty)
}

export const exportBudgetData = (budgetData: BudgetData): string =>
  JSON.stringify(budgetData, null, 2)

export const importBudgetData = (rawValue: string): BudgetData => {
  const parsed = normalizeBudgetData(JSON.parse(rawValue))
  return writeBudgetData(parsed)
}

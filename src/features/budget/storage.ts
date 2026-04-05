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
    settings: {
      ...DEFAULT_SETTINGS,
      ...raw.settings,
      housingPlan: {
        ...DEFAULT_SETTINGS.housingPlan,
        ...raw.settings?.housingPlan,
      },
      fixedExpenses: Array.isArray(raw.settings?.fixedExpenses)
        ? raw.settings.fixedExpenses
        : [],
      cutoffs: Array.isArray(raw.settings?.cutoffs)
        ? raw.settings.cutoffs
        : DEFAULT_SETTINGS.cutoffs,
      quickAmountPresets: Array.isArray(raw.settings?.quickAmountPresets)
        ? raw.settings.quickAmountPresets
        : DEFAULT_SETTINGS.quickAmountPresets,
    },
    incomes: Array.isArray(raw.incomes) ? raw.incomes : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
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

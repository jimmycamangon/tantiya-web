import { useEffect, useMemo, useState } from 'react'
import { getCurrentBudgetSnapshot } from '@/features/budget/calculations'
import {
  importBudgetData,
  readBudgetData,
  resetBudgetData,
  writeBudgetData,
} from '@/features/budget/storage'
import type {
  BudgetData,
  BudgetSettings,
  ExpenseCategory,
  ExpenseEntry,
  IncomeEntry,
} from '@/types/budget'

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

const stampUpdatedBudget = (budgetData: BudgetData): BudgetData => ({
  ...budgetData,
  updatedAt: new Date().toISOString(),
})

export const useBudgetStore = () => {
  const [budgetData, setBudgetData] = useState<BudgetData>(() => readBudgetData())

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key) {
        setBudgetData(readBudgetData())
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const persist = (nextBudgetData: BudgetData) => {
    const saved = writeBudgetData(stampUpdatedBudget(nextBudgetData))
    setBudgetData(saved)
    return saved
  }

  const setSettings = (nextSettings: BudgetSettings) =>
    persist({
      ...budgetData,
      settings: nextSettings,
    })

  const patchSettings = (partialSettings: Partial<BudgetSettings>) =>
    persist({
      ...budgetData,
      settings: {
        ...budgetData.settings,
        ...partialSettings,
        housingPlan: {
          ...budgetData.settings.housingPlan,
          ...partialSettings.housingPlan,
        },
      },
    })

  const addIncome = (
    income: Omit<IncomeEntry, 'id' | 'receivedAt'> & { receivedAt?: string },
  ) =>
    persist({
      ...budgetData,
      incomes: [
        ...budgetData.incomes,
        {
          ...income,
          id: createId('income'),
          receivedAt: income.receivedAt ?? new Date().toISOString(),
        },
      ],
    })

  const addExpense = (expense: {
    amount: number
    category: ExpenseCategory
    cutoffId?: string
    note?: string
    source?: ExpenseEntry['source']
    createdAt?: string
  }) =>
    persist({
      ...budgetData,
      expenses: [
        ...budgetData.expenses,
        {
          id: createId('expense'),
          amount: expense.amount,
          category: expense.category,
          cutoffId: expense.cutoffId,
          note: expense.note,
          source: expense.source ?? 'quick-tap',
          createdAt: expense.createdAt ?? new Date().toISOString(),
        },
      ],
    })

  const removeExpense = (expenseId: string) =>
    persist({
      ...budgetData,
      expenses: budgetData.expenses.filter((expense) => expense.id !== expenseId),
    })

  const replaceAll = (nextBudgetData: BudgetData) => {
    const saved = writeBudgetData(nextBudgetData)
    setBudgetData(saved)
    return saved
  }

  const restoreFromBackup = (rawValue: string) => {
    const saved = importBudgetData(rawValue)
    setBudgetData(saved)
    return saved
  }

  const resetAll = () => {
    const empty = resetBudgetData()
    setBudgetData(empty)
    return empty
  }

  const snapshot = useMemo(
    () => getCurrentBudgetSnapshot(budgetData),
    [budgetData],
  )

  return {
    budgetData,
    snapshot,
    setSettings,
    patchSettings,
    addIncome,
    addExpense,
    removeExpense,
    replaceAll,
    restoreFromBackup,
    resetAll,
  }
}

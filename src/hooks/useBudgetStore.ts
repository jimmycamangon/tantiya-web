import { useEffect, useMemo, useState } from 'react'
import {
  getCurrentBudgetCycle,
  getCurrentBudgetSnapshot,
} from '@/features/budget/calculations'
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
  FixedExpensePaymentRecord,
  IncomeEntry,
} from '@/types/budget'

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

const stampUpdatedBudget = (budgetData: BudgetData): BudgetData => ({
  ...budgetData,
  updatedAt: new Date().toISOString(),
})

export const useBudgetStore = () => {
  const [budgetData, setBudgetData] = useState<BudgetData>(() => readBudgetData())
  const [cycleNotice, setCycleNotice] = useState<{
    previousLabel: string
    nextLabel: string
    nextRangeLabel: string
  } | null>(null)

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key) {
        setBudgetData(readBudgetData())
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    const currentCycle = getCurrentBudgetCycle(budgetData)

    if (budgetData.lifecycle.lastSeenCycleKey === currentCycle.key) {
      return
    }

    if (budgetData.lifecycle.lastSeenCycleLabel) {
      setCycleNotice({
        previousLabel: budgetData.lifecycle.lastSeenCycleLabel,
        nextLabel: currentCycle.label,
        nextRangeLabel: currentCycle.rangeLabel,
      })
    }

    const saved = writeBudgetData(
      stampUpdatedBudget({
        ...budgetData,
        lifecycle: {
          lastSeenCycleKey: currentCycle.key,
          lastSeenCycleLabel: currentCycle.label,
          lastRolloverAt: new Date().toISOString(),
        },
      }),
    )

    setBudgetData(saved)
  }, [budgetData])

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

  const removeIncome = (incomeId: string) =>
    persist({
      ...budgetData,
      incomes: budgetData.incomes.filter((income) => income.id !== incomeId),
    })

  const updateIncome = (
    incomeId: string,
    patch: Partial<Pick<IncomeEntry, 'label' | 'amount' | 'receivedAt' | 'cutoffId' | 'notes'>>,
  ) =>
    persist({
      ...budgetData,
      incomes: budgetData.incomes.map((income) =>
        income.id === incomeId
          ? {
              ...income,
              ...patch,
            }
          : income,
      ),
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

  const updateExpense = (
    expenseId: string,
    patch: Partial<Pick<ExpenseEntry, 'amount' | 'category' | 'cutoffId' | 'note' | 'createdAt'>>,
  ) =>
    persist({
      ...budgetData,
      expenses: budgetData.expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              ...patch,
            }
          : expense,
      ),
    })

  const markFixedExpensePaid = ({
    fixedExpenseId,
    cycleKey,
    cutoffId,
  }: Pick<FixedExpensePaymentRecord, 'fixedExpenseId' | 'cycleKey' | 'cutoffId'>) => {
    const existing = budgetData.fixedExpensePayments.find(
      (record) => record.fixedExpenseId === fixedExpenseId && record.cycleKey === cycleKey,
    )

    if (existing) {
      return persist({
        ...budgetData,
        fixedExpensePayments: budgetData.fixedExpensePayments.map((record) =>
          record.id === existing.id
            ? {
                ...record,
                cutoffId,
                markedPaidAt: new Date().toISOString(),
              }
            : record,
        ),
      })
    }

    return persist({
      ...budgetData,
      fixedExpensePayments: [
        ...budgetData.fixedExpensePayments,
        {
          id: createId('fixed-expense-payment'),
          fixedExpenseId,
          cycleKey,
          cutoffId,
          markedPaidAt: new Date().toISOString(),
        },
      ],
    })
  }

  const unmarkFixedExpensePaid = ({
    fixedExpenseId,
    cycleKey,
  }: Pick<FixedExpensePaymentRecord, 'fixedExpenseId' | 'cycleKey'>) =>
    persist({
      ...budgetData,
      fixedExpensePayments: budgetData.fixedExpensePayments.filter(
        (record) => !(record.fixedExpenseId === fixedExpenseId && record.cycleKey === cycleKey),
      ),
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
    cycleNotice,
    dismissCycleNotice: () => setCycleNotice(null),
    setSettings,
    patchSettings,
    addIncome,
    removeIncome,
    updateIncome,
    addExpense,
    removeExpense,
    updateExpense,
    markFixedExpensePaid,
    unmarkFixedExpensePaid,
    replaceAll,
    restoreFromBackup,
    resetAll,
  }
}

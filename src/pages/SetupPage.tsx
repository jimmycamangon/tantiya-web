import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_QUICK_AMOUNT_PRESETS } from '@/features/budget/constants'
import {
  getCutoffForDate,
  getHousingAmountForCutoff,
  getHousingCost,
} from '@/features/budget/calculations'
import { useBudgetStore } from '@/hooks/useBudgetStore'
import type {
  BudgetSettings,
  CutoffDefinition,
  ExpenseCategory,
  FixedExpense,
  PayrollDeductionType,
} from '@/types/budget'

const categoryOptions: Array<FixedExpense['category']> = [
  'bills',
  'house',
  'utilities',
  'loan',
  'food',
  'fare',
  'load',
  'shopping',
  'other',
]

const payrollDeductionTypeOptions: Array<{ value: PayrollDeductionType; label: string }> = [
  { value: 'sss', label: 'SSS' },
  { value: 'pagibig', label: 'Pag-IBIG' },
  { value: 'philhealth', label: 'PhilHealth' },
  { value: 'wtax', label: 'WTax' },
]

const createLocalId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

const cloneSettings = (settings: BudgetSettings): BudgetSettings => ({
  ...settings,
  fixedExpenses: settings.fixedExpenses.map((expense) => ({ ...expense })),
  cutoffs: settings.cutoffs.map((cutoff) => ({ ...cutoff })),
  quickAmountPresets: settings.quickAmountPresets.map((preset) => ({ ...preset })),
  allowancePlan: { ...settings.allowancePlan },
  cutoffCarryoverPlan: { ...settings.cutoffCarryoverPlan },
  payrollDeductions: settings.payrollDeductions.map((deduction) => ({ ...deduction })),
  housingPlan: { ...settings.housingPlan },
})

const toNumber = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toDayNumber = (value: string) => {
  const parsed = Math.trunc(Number(value))
  if (!Number.isFinite(parsed)) return 1
  return Math.min(31, Math.max(1, parsed))
}

const normalizeQuickAmountPresets = (presets: BudgetSettings['quickAmountPresets']) => {
  const uniqueValues = Array.from(
    new Set(
      presets
        .map((preset) => Math.trunc(preset.value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  ).sort((left, right) => left - right)

  return uniqueValues.map((value) => ({
    id: `preset-${value}`,
    value,
  }))
}

type SetupSectionId =
  | 'income'
  | 'quick-presets'
  | 'fixed-expenses'
  | 'payroll-deductions'
  | 'cutoff-rules'
  | 'housing'
  | 'preview'

export default function SetupPage() {
  const navigate = useNavigate()
  const { budgetData, setSettings } = useBudgetStore()
  const [form, setForm] = useState<BudgetSettings>(() => cloneSettings(budgetData.settings))
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle')
  const [newPresetValue, setNewPresetValue] = useState('')
  const [previewScope, setPreviewScope] = useState<'whole-month' | 'current-cutoff' | string>('whole-month')
  const [isCompactSetup, setIsCompactSetup] = useState(false)
  const [activeSetupSection, setActiveSetupSection] = useState<SetupSectionId>('income')

  useEffect(() => {
    setForm(cloneSettings(budgetData.settings))
  }, [budgetData.settings])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 1279px)')
    const applyMatch = (matches: boolean) => setIsCompactSetup(matches)

    applyMatch(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => applyMatch(event.matches)

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const fixedExpenseTotal = useMemo(
    () =>
      form.fixedExpenses.reduce((sum, expense) => {
        if (!expense.isActive || expense.budgetApplication !== 'whole-month') return sum
        return sum + expense.amount
      }, 0),
    [form.fixedExpenses],
  )

  const configuredCutoffIncomeTotal = useMemo(
    () =>
      form.cutoffs.reduce((sum, cutoff) => {
        if (!cutoff.isActive) return sum
        return sum + (cutoff.expectedIncomeAmount ?? 0)
      }, 0),
    [form.cutoffs],
  )
  const allowanceAmountInSummary = form.allowancePlan.enabled
    ? form.viewMode === 'cutoff' && form.allowancePlan.frequency === 'per-cutoff'
      ? form.allowancePlan.amount * form.cutoffs.filter((cutoff) => cutoff.isActive).length
      : form.allowancePlan.amount
    : 0
  const payrollDeductionTotal = useMemo(
    () =>
      form.payrollDeductions.reduce((sum, deduction) => {
        if (!deduction.enabled) return sum
        return sum + deduction.amount
      }, 0),
    [form.payrollDeductions],
  )
  const activeCutoffs = useMemo(
    () => form.cutoffs.filter((cutoff) => cutoff.isActive),
    [form.cutoffs],
  )
  const currentMatchedCutoff = useMemo(
    () =>
      activeCutoffs.find((cutoff) => cutoff.id === form.activeCutoffId) ??
      getCutoffForDate(new Date(), activeCutoffs),
    [activeCutoffs, form.activeCutoffId],
  )

  const activeHousingAmount = useMemo(() => getHousingCost(form.housingPlan), [form.housingPlan])
  const housingSplitAmount = useMemo(
    () =>
      activeCutoffs.length > 0 ? activeHousingAmount / activeCutoffs.length : activeHousingAmount,
    [activeCutoffs.length, activeHousingAmount],
  )
  const isEquityActive = form.housingPlan.phase === 'equity' && form.housingPlan.equityMonthsPaid < form.housingPlan.equityMonths
  const housingStatusCopy = !form.housingPlan.enabled
    ? 'Housing plan is turned off right now.'
    : isEquityActive
      ? `Equity is still active, so Tantiya currently uses PHP ${form.housingPlan.equityAmount.toLocaleString()} in the budget.`
      : `Equity is complete or phase is set to amortization, so Tantiya currently uses PHP ${form.housingPlan.amortizationAmount.toLocaleString()} in the budget.`
  const housingApplicationCopy = !form.housingPlan.enabled
    ? 'Housing is off, so it will not affect the preview yet.'
    : form.viewMode !== 'cutoff' || form.housingPlan.budgetApplication === 'whole-month'
      ? 'The full housing amount stays in the whole-month budget.'
      : form.housingPlan.budgetApplication === 'split-across-cutoffs'
        ? `The active housing amount is split across ${activeCutoffs.length || 1} active cutoff(s), so each cutoff currently gets PHP ${housingSplitAmount.toLocaleString()}.`
        : `The full housing amount is assigned only to ${activeCutoffs.find((cutoff) => cutoff.id === form.housingPlan.cutoffId)?.label ?? 'the selected cutoff'}.`

  const addFixedExpense = () => {
    setForm((current) => ({
      ...current,
      fixedExpenses: [
        ...current.fixedExpenses,
        {
          id: createLocalId('fixed-expense'),
          name: '',
          amount: 0,
          category: 'bills',
          budgetApplication: 'whole-month',
          cutoffDueDays: {},
          isActive: true,
        },
      ],
    }))
  }

  const updateFixedExpense = (
    expenseId: string,
    patch: Partial<FixedExpense>,
  ) => {
    setForm((current) => ({
      ...current,
      fixedExpenses: current.fixedExpenses.map((expense) =>
        expense.id === expenseId ? { ...expense, ...patch } : expense,
      ),
    }))
  }

  const removeFixedExpense = (expenseId: string) => {
    setForm((current) => ({
      ...current,
      fixedExpenses: current.fixedExpenses.filter((expense) => expense.id !== expenseId),
    }))
  }

  const updatePayrollDeduction = (
    deductionId: string,
    patch: Partial<BudgetSettings['payrollDeductions'][number]>,
  ) => {
    setForm((current) => ({
      ...current,
      payrollDeductions: current.payrollDeductions.map((deduction) =>
        deduction.id === deductionId ? { ...deduction, ...patch } : deduction,
      ),
    }))
  }

  const addPayrollDeduction = (type: PayrollDeductionType = 'wtax') => {
    const selectedType = payrollDeductionTypeOptions.find((option) => option.value === type)

    setForm((current) => ({
      ...current,
      payrollDeductions: [
        ...current.payrollDeductions,
        {
          id: createLocalId('payroll-deduction'),
          type,
          label: selectedType?.label ?? 'Payroll deduction',
          amount: 0,
          enabled: true,
        },
      ],
    }))
  }

  const removePayrollDeduction = (deductionId: string) => {
    setForm((current) => ({
      ...current,
      payrollDeductions: current.payrollDeductions.filter((deduction) => deduction.id !== deductionId),
    }))
  }

  const addCutoff = () => {
    setForm((current) => ({
      ...current,
      cutoffs: [
        ...current.cutoffs,
        {
          id: createLocalId('cutoff'),
          label: `Cutoff ${current.cutoffs.length + 1}`,
          startDay: 1,
          endDay: 15,
          expectedIncomeAmount: 0,
          expectedPayoutOffsetDays: 10,
          isActive: true,
        },
      ],
    }))
  }

  const updateCutoff = (cutoffId: string, patch: Partial<CutoffDefinition>) => {
    setForm((current) => ({
      ...current,
      cutoffs: current.cutoffs.map((cutoff) =>
        cutoff.id === cutoffId ? { ...cutoff, ...patch } : cutoff,
      ),
    }))
  }

  const removeCutoff = (cutoffId: string) => {
    setForm((current) => ({
      ...current,
      cutoffs: current.cutoffs.filter((cutoff) => cutoff.id !== cutoffId),
    }))
  }

  const addQuickAmountPreset = () => {
    const parsedValue = Math.trunc(Number(newPresetValue))
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) return

    setForm((current) => {
      if (current.quickAmountPresets.some((preset) => preset.value === parsedValue)) {
        return current
      }

      return {
        ...current,
        quickAmountPresets: normalizeQuickAmountPresets([
          ...current.quickAmountPresets,
          {
            id: createLocalId('preset'),
            value: parsedValue,
          },
        ]),
      }
    })

    setNewPresetValue('')
  }

  const removeQuickAmountPreset = (presetId: string) => {
    setForm((current) => ({
      ...current,
      quickAmountPresets: current.quickAmountPresets.filter((preset) => preset.id !== presetId),
    }))
  }

  const parsedNewPreset = Math.trunc(Number(newPresetValue))
  const presetAlreadyExists = form.quickAmountPresets.some(
    (preset) => preset.value === parsedNewPreset,
  )
  const canAddPreset =
    newPresetValue.trim().length > 0 &&
    Number.isFinite(parsedNewPreset) &&
    parsedNewPreset > 0 &&
    !presetAlreadyExists

  useEffect(() => {
    if (form.viewMode !== 'cutoff') {
      setPreviewScope('whole-month')
      return
    }

    if (previewScope === 'whole-month' || previewScope === 'current-cutoff') {
      return
    }

    if (!activeCutoffs.some((cutoff) => cutoff.id === previewScope)) {
      setPreviewScope('whole-month')
    }
  }, [activeCutoffs, form.viewMode, previewScope])

  useEffect(() => {
    if (form.viewMode !== 'cutoff') {
      return
    }

    if (form.activeCutoffId && !activeCutoffs.some((cutoff) => cutoff.id === form.activeCutoffId)) {
      setForm((current) => ({
        ...current,
        activeCutoffId: undefined,
      }))
    }
  }, [activeCutoffs, form.activeCutoffId, form.viewMode])

  const previewData = useMemo(() => {
    const activeCutoffCount = activeCutoffs.length
    const wholeMonthAllowance = allowanceAmountInSummary

    if (form.viewMode !== 'cutoff' || previewScope === 'whole-month') {
      const income =
        (form.viewMode === 'cutoff' ? configuredCutoffIncomeTotal : form.monthlyIncomeTarget) +
        wholeMonthAllowance
      const remaining =
        income -
        fixedExpenseTotal -
        payrollDeductionTotal -
        activeHousingAmount -
        form.savingsBuffer

      return {
        label: 'Whole month',
        income,
        allowance: wholeMonthAllowance,
        fixed: fixedExpenseTotal,
        payroll: payrollDeductionTotal,
        housing: activeHousingAmount,
        carryover: 0,
        savings: form.savingsBuffer,
        remaining,
        note:
          form.viewMode === 'cutoff'
            ? 'Whole-month preview combines all active cutoffs plus monthly items like housing and reserved savings.'
            : 'Whole-month preview shows the current monthly budget based on your setup.',
      }
    }

    const focusedCutoff =
      previewScope === 'current-cutoff'
        ? currentMatchedCutoff
        : activeCutoffs.find((cutoff) => cutoff.id === previewScope)

    if (!focusedCutoff) {
      return {
        label: 'No matched cutoff',
        income: 0,
        allowance: 0,
        fixed: 0,
        payroll: 0,
        housing: 0,
        carryover: 0,
        savings: 0,
        remaining: 0,
        note: 'No active cutoff is available for this preview yet.',
      }
    }

    const focusedAllowance = !form.allowancePlan.enabled
      ? 0
      : form.allowancePlan.frequency === 'per-cutoff'
        ? form.allowancePlan.amount
        : activeCutoffCount > 0
          ? form.allowancePlan.amount / activeCutoffCount
          : 0
    const focusedFixed = form.fixedExpenses.reduce((sum, expense) => {
      if (!expense.isActive) return sum
      if (expense.budgetApplication === 'whole-month') return sum
      if (expense.budgetApplication === 'specific-cutoff' && expense.cutoffId !== focusedCutoff.id) {
        return sum
      }
      return sum + expense.amount
    }, 0)
    const focusedPayroll = form.payrollDeductions.reduce((sum, deduction) => {
      if (!deduction.enabled) return sum
      if (deduction.cutoffId && deduction.cutoffId !== focusedCutoff.id) return sum
      return sum + deduction.amount
    }, 0)
    const focusedHousing = getHousingAmountForCutoff(form.housingPlan, activeCutoffs, focusedCutoff.id)
    const focusedCarryover =
      form.cutoffCarryoverPlan.enabled && form.cutoffCarryoverPlan.cutoffId === focusedCutoff.id
        ? form.cutoffCarryoverPlan.amount
        : 0
    const income = focusedCutoff.expectedIncomeAmount + focusedAllowance

    return {
      label:
        previewScope === 'current-cutoff'
          ? `${focusedCutoff.label} (Current)`
          : focusedCutoff.label,
      income,
      allowance: focusedAllowance,
      fixed: focusedFixed,
      payroll: focusedPayroll,
      housing: focusedHousing,
      carryover: focusedCarryover,
      savings: 0,
      remaining: income + focusedCarryover - focusedFixed - focusedPayroll - focusedHousing,
      note:
        form.housingPlan.enabled && form.housingPlan.budgetApplication !== 'whole-month'
          ? 'Cutoff preview focuses on the selected payroll period and includes the housing amount assigned to this cutoff.'
          : 'Cutoff preview focuses on the selected payroll period. Reserved savings stays in the whole-month preview.',
    }
  }, [
    activeCutoffs,
    activeHousingAmount,
    allowanceAmountInSummary,
    configuredCutoffIncomeTotal,
    currentMatchedCutoff,
    fixedExpenseTotal,
    form.allowancePlan,
    form.fixedExpenses,
    form.housingPlan,
    form.payrollDeductions,
    form.savingsBuffer,
    form.viewMode,
    payrollDeductionTotal,
    previewScope,
  ])

  const setupSections = useMemo(() => {
    const hasIncomeReady =
      form.viewMode === 'monthly'
        ? form.monthlyIncomeTarget > 0
        : activeCutoffs.some((cutoff) => (cutoff.expectedIncomeAmount ?? 0) > 0)
    const enabledFixedExpenses = form.fixedExpenses.filter((expense) => expense.isActive)
    const enabledDeductions = form.payrollDeductions.filter((deduction) => deduction.enabled)
    const housingReady = !form.housingPlan.enabled || activeHousingAmount > 0
    const cutoffReady = form.viewMode === 'monthly' || activeCutoffs.length > 0

    return [
      {
        id: 'income' as const,
        title: 'Income',
        description: 'Choose your budget mode, planned income, and optional allowance.',
        ready: hasIncomeReady,
        status: hasIncomeReady
          ? form.viewMode === 'cutoff'
            ? `${activeCutoffs.filter((cutoff) => (cutoff.expectedIncomeAmount ?? 0) > 0).length} cutoff income row(s) ready`
            : 'Monthly target is set'
          : 'Set your main income first',
      },
      {
        id: 'quick-presets' as const,
        title: 'Quick presets',
        description: 'Pick the amounts that appear in Quick Deduct.',
        ready: form.quickAmountPresets.length > 0,
        status: `${form.quickAmountPresets.length} preset amount(s)`,
      },
      {
        id: 'fixed-expenses' as const,
        title: 'Fixed expenses',
        description: 'Add recurring bills and cutoff/month assignment rules.',
        ready: enabledFixedExpenses.length > 0,
        status:
          enabledFixedExpenses.length > 0
            ? `${enabledFixedExpenses.length} active recurring bill(s)`
            : 'Optional, but recommended',
      },
      {
        id: 'payroll-deductions' as const,
        title: 'Payroll deductions',
        description: 'Track SSS, Pag-IBIG, PhilHealth, WTax, or custom deduction rows.',
        ready: true,
        status:
          enabledDeductions.length > 0
            ? `${enabledDeductions.length} deduction row(s) enabled`
            : 'Optional section',
      },
      {
        id: 'cutoff-rules' as const,
        title: 'Cutoff rules',
        description: 'Define salary periods, payout offsets, and active cutoff behavior.',
        ready: cutoffReady,
        status:
          form.viewMode === 'monthly'
            ? 'Not needed in monthly mode'
            : `${activeCutoffs.length} active cutoff(s)`,
      },
      {
        id: 'housing' as const,
        title: 'Housing',
        description: 'Set equity or amortization and how housing affects the budget.',
        ready: housingReady,
        status:
          !form.housingPlan.enabled
            ? 'Optional section'
            : `Using PHP ${activeHousingAmount.toLocaleString()} right now`,
      },
      {
        id: 'preview' as const,
        title: 'Preview',
        description: 'Review the live budget effect before saving.',
        ready: true,
        status: `${previewData.label} preview ready`,
      },
    ]
  }, [
    activeCutoffs,
    activeHousingAmount,
    form.fixedExpenses,
    form.housingPlan.enabled,
    form.monthlyIncomeTarget,
    form.payrollDeductions,
    form.quickAmountPresets.length,
    form.viewMode,
    previewData.label,
  ])

  const completedSections = setupSections.filter((section) => section.ready).length
  const sectionIds = setupSections.map((section) => section.id)
  const activeSectionIndex = Math.max(sectionIds.indexOf(activeSetupSection), 0)
  const previousSectionId = activeSectionIndex > 0 ? sectionIds[activeSectionIndex - 1] : null
  const nextSectionId =
    activeSectionIndex < sectionIds.length - 1 ? sectionIds[activeSectionIndex + 1] : null

  const getSectionClassName = (sectionId: SetupSectionId, baseClassName: string) =>
    [
      baseClassName,
      isCompactSetup && activeSetupSection !== sectionId ? 'hidden' : '',
    ]
      .filter(Boolean)
      .join(' ')

  const jumpToSection = (sectionId: SetupSectionId) => {
    setActiveSetupSection(sectionId)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const saveSetup = () => {
    const normalizedPresets = normalizeQuickAmountPresets(form.quickAmountPresets)

    const normalized: BudgetSettings = {
      ...form,
      activeCutoffId:
        form.activeCutoffId && form.cutoffs.some((cutoff) => cutoff.id === form.activeCutoffId && cutoff.isActive)
          ? form.activeCutoffId
          : undefined,
      fixedExpenses: form.fixedExpenses.filter((expense) => expense.name.trim().length > 0),
      cutoffs: form.cutoffs.filter((cutoff) => cutoff.label.trim().length > 0),
      quickAmountPresets:
        normalizedPresets.length > 0 ? normalizedPresets : DEFAULT_QUICK_AMOUNT_PRESETS,
    }

    setSettings(normalized)
    setSaveState('saved')
    window.setTimeout(() => setSaveState('idle'), 1800)
  }

  return (
    <section className="space-y-6">
      <div className="surface-card rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] p-6 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700 dark:text-amber-300">
          Budget setup
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">
          Set income, obligations, and cutoff rules.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          This setup becomes the source of truth for your dashboard, quick deduct actions, and
          budget cycle tracking.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={saveSetup} className="public-primary-button px-6">
            {saveState === 'saved' ? 'Saved' : 'Save setup'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="public-outline-button px-6">
            Go to dashboard
          </button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card/60 px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
              Setup progress
            </p>
            <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">
              {completedSections}/{setupSections.length}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Move through the sections in order, then review the preview on the right before saving.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {setupSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => jumpToSection(section.id)}
                className="rounded-2xl border border-border bg-card/60 px-4 py-4 text-left transition hover:border-emerald-400/70 hover:bg-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{section.title}</p>
                  <span
                    className={[
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                      section.ready
                        ? 'bg-emerald-100 emerald-copy dark:bg-emerald-950/40'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
                    ].join(' ')}
                  >
                    {section.ready ? 'Ready' : 'Needs input'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.description}</p>
                <p className="mt-3 text-xs font-medium text-foreground/80">{section.status}</p>
              </button>
            ))}
          </div>
        </div>

        {isCompactSetup && (
          <div className="mt-6 rounded-2xl border border-border bg-card/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                  Mobile setup flow
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Focus on one section at a time. Use next and back to move through the setup.
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                Step {activeSectionIndex + 1} of {sectionIds.length}
              </span>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2">
                {setupSections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => jumpToSection(section.id)}
                    className={[
                      'rounded-full border px-4 py-2 text-sm font-medium transition',
                      activeSetupSection === section.id
                        ? 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-emerald-950'
                        : 'border-border bg-background text-foreground hover:border-emerald-400/70',
                    ].join(' ')}
                  >
                    {index + 1}. {section.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          <section
            id="income"
            className={getSectionClassName('income', 'surface-card rounded-[1.75rem] p-5 scroll-mt-24')}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Income
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Start here first. This tells Tantiya whether you are budgeting by month or by payroll cutoff.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Budget cycle</span>
                <select
                  value={form.viewMode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      viewMode: event.target.value as BudgetSettings['viewMode'],
                    }))
                  }
                  className="ui-input"
                >
                  <option value="monthly">Monthly only</option>
                  <option value="cutoff">Cutoff tracking</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Choose monthly if you only manage one whole-month budget. Choose cutoff if you
                  want payroll-period tracking and comparisons.
                </p>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  {form.viewMode === 'cutoff' ? 'Expected monthly income total' : 'Monthly income target'}
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.monthlyIncomeTarget}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      monthlyIncomeTarget: toNumber(event.target.value),
                    }))
                  }
                  className="ui-input"
                  placeholder="25000"
                />
                <p className="text-sm text-muted-foreground">
                  {form.viewMode === 'cutoff'
                    ? 'Optional monthly reference only. In cutoff mode, the real budget uses the income values you enter for each cutoff below.'
                    : 'This is the main income number used for monthly budgeting.'}
                </p>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Reserved savings</span>
                <input
                  type="number"
                  min="0"
                  value={form.savingsBuffer}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      savingsBuffer: toNumber(event.target.value),
                    }))
                  }
                  className="ui-input"
                  placeholder="3000"
                />
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Allowance</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Optional extra income for users whose company gives a regular allowance.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={form.allowancePlan.enabled}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        allowancePlan: {
                          ...current.allowancePlan,
                          enabled: event.target.checked,
                        },
                      }))
                    }
                  />
                  Enabled
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Allowance amount</span>
                  <input
                    type="number"
                    min="0"
                    value={form.allowancePlan.amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        allowancePlan: {
                          ...current.allowancePlan,
                          amount: toNumber(event.target.value),
                        },
                      }))
                    }
                    className="ui-input"
                    placeholder="2000"
                    disabled={!form.allowancePlan.enabled}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Frequency</span>
                  <select
                    value={form.allowancePlan.frequency}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        allowancePlan: {
                          ...current.allowancePlan,
                          frequency: event.target.value as BudgetSettings['allowancePlan']['frequency'],
                        },
                      }))
                    }
                    className="ui-input"
                    disabled={!form.allowancePlan.enabled}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="per-cutoff">Per cutoff</option>
                  </select>
                </label>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                {!form.allowancePlan.enabled
                  ? 'Leave this off if the user has no allowance.'
                  : form.viewMode === 'cutoff'
                    ? form.allowancePlan.frequency === 'per-cutoff'
                      ? 'This allowance will be added to every active cutoff budget.'
                      : 'This monthly allowance will be split across active cutoffs for focused cutoff budgeting.'
                    : 'This allowance will be added on top of the monthly budget.'}
              </p>
            </div>
          </section>

          <section
            id="quick-presets"
            className={getSectionClassName('quick-presets', 'surface-card rounded-[1.75rem] p-5 scroll-mt-24')}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Quick amount presets
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose the values that appear in Quick Deduct, including small taps like 1 or 5
                  pesos.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex-1 space-y-2">
                  <span className="text-sm font-medium text-foreground">Add preset amount</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newPresetValue}
                    onChange={(event) => setNewPresetValue(event.target.value)}
                    className="ui-input"
                    placeholder="1 or 5"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addQuickAmountPreset}
                    disabled={!canAddPreset}
                    className="public-outline-button px-4 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add preset
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                {newPresetValue.trim().length === 0
                  ? 'Example: add 1, 5, 10, or any amount you use often.'
                  : !Number.isFinite(parsedNewPreset) || parsedNewPreset <= 0
                    ? 'Enter a whole number greater than zero.'
                    : presetAlreadyExists
                      ? `PHP ${parsedNewPreset.toLocaleString()} is already in your presets.`
                      : `PHP ${parsedNewPreset.toLocaleString()} is ready to add.`}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {form.quickAmountPresets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                    No presets yet. If you save without adding one, Tantiya will restore the
                    default quick amounts.
                  </div>
                ) : (
                  form.quickAmountPresets
                    .slice()
                    .sort((left, right) => left.value - right.value)
                    .map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-2"
                      >
                        <span className="text-sm font-medium text-foreground">
                          PHP {preset.value.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeQuickAmountPreset(preset.id)}
                          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </section>

          <section
            id="fixed-expenses"
            className={getSectionClassName('fixed-expenses', 'surface-card rounded-[1.75rem] p-5 scroll-mt-24')}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Fixed expenses
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add recurring bills and obligations that should always be included in your budget.
                </p>
              </div>
              <button type="button" onClick={addFixedExpense} className="public-outline-button px-4">
                Add expense
              </button>
            </div>

            <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {form.fixedExpenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No fixed expenses yet. Add your bills, utilities, loans, or recurring house costs.
                </div>
              ) : (
                form.fixedExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-2xl border border-border bg-card/60 p-4"
                  >
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input
                          type="text"
                          value={expense.name}
                          onChange={(event) =>
                            updateFixedExpense(expense.id, { name: event.target.value })
                          }
                          className="ui-input"
                          placeholder="Electric bill"
                        />
                        <input
                          type="number"
                          min="0"
                          value={expense.amount}
                          onChange={(event) =>
                            updateFixedExpense(expense.id, { amount: toNumber(event.target.value) })
                          }
                          className="ui-input"
                          placeholder="0"
                        />
                        <select
                          value={expense.category}
                          onChange={(event) =>
                            updateFixedExpense(expense.id, {
                              category: event.target.value as ExpenseCategory | 'loan' | 'utilities',
                            })
                          }
                          className="ui-input"
                        >
                          {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={expense.isActive}
                            onChange={(event) =>
                              updateFixedExpense(expense.id, { isActive: event.target.checked })
                            }
                          />
                          Active
                        </label>
                        <button
                          type="button"
                          onClick={() => removeFixedExpense(expense.id)}
                          className="ui-button-subtle"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <label className="space-y-2">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Apply to
                        </span>
                        <select
                          value={
                            expense.budgetApplication === 'specific-cutoff'
                              ? expense.cutoffId ?? 'whole-month'
                              : expense.budgetApplication
                          }
                          onChange={(event) => {
                            const value = event.target.value
                            updateFixedExpense(expense.id, {
                              budgetApplication:
                                value === 'every-cutoff'
                                  ? 'every-cutoff'
                                  : value === 'whole-month'
                                    ? 'whole-month'
                                    : 'specific-cutoff',
                              cutoffId:
                                value === 'every-cutoff' || value === 'whole-month'
                                  ? undefined
                                  : value,
                            })
                          }}
                          className="ui-input"
                        >
                          <option value="whole-month">Whole month</option>
                          {form.viewMode === 'cutoff' && (
                            <option value="every-cutoff">Every cutoff</option>
                          )}
                          {form.viewMode === 'cutoff' &&
                            activeCutoffs.map((cutoff) => (
                              <option key={cutoff.id} value={cutoff.id}>
                                {cutoff.label}
                              </option>
                            ))}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Due day
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={
                            expense.budgetApplication === 'every-cutoff'
                              ? ''
                              : expense.dueDay ?? ''
                          }
                          onChange={(event) =>
                            updateFixedExpense(expense.id, {
                              dueDay: event.target.value ? toDayNumber(event.target.value) : undefined,
                            })
                          }
                          className="ui-input"
                          placeholder="10"
                          disabled={expense.budgetApplication === 'every-cutoff'}
                        />
                      </label>

                      <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                        {expense.budgetApplication === 'whole-month'
                          ? 'This bill reduces the whole-month budget once.'
                          : expense.budgetApplication === 'every-cutoff'
                            ? 'This bill repeats in every active cutoff.'
                            : `This bill only affects ${
                                activeCutoffs.find((cutoff) => cutoff.id === expense.cutoffId)?.label ??
                              'the selected cutoff'
                              }.`}
                      </div>
                    </div>

                    {expense.budgetApplication === 'every-cutoff' && form.viewMode === 'cutoff' && (
                      <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-4">
                        <p className="text-sm font-medium text-foreground">
                          Due day per cutoff
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Set a different reminder day for each cutoff while keeping this as one recurring bill.
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {activeCutoffs.map((cutoff) => (
                            <label key={`${expense.id}-${cutoff.id}`} className="space-y-2">
                              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                {cutoff.label}
                              </span>
                              <input
                                type="number"
                                min="1"
                                max="31"
                                value={expense.cutoffDueDays?.[cutoff.id] ?? ''}
                                onChange={(event) => {
                                  const nextCutoffDueDays = { ...(expense.cutoffDueDays ?? {}) }

                                  if (event.target.value) {
                                    nextCutoffDueDays[cutoff.id] = toDayNumber(event.target.value)
                                  } else {
                                    delete nextCutoffDueDays[cutoff.id]
                                  }

                                  updateFixedExpense(expense.id, {
                                    cutoffDueDays: nextCutoffDueDays,
                                  })
                                }}
                                className="ui-input"
                                placeholder={cutoff.id === activeCutoffs[0]?.id ? '26' : '11'}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section
            id="payroll-deductions"
            className={getSectionClassName('payroll-deductions', 'surface-card rounded-[1.75rem] p-5 scroll-mt-24')}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Payroll deductions
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Optional salary deductions like SSS, Pag-IBIG, PhilHealth, and WTax. In cutoff mode,
                  you can choose which cutoff they affect.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addPayrollDeduction('wtax')}
                className="public-outline-button px-4"
              >
                Add deduction
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {form.payrollDeductions.map((deduction) => (
                <div
                  key={deduction.id}
                  className="rounded-2xl border border-border bg-card/60 p-4"
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Deduction type
                        </span>
                        <select
                          value={deduction.type}
                          onChange={(event) => {
                            const nextType = event.target.value as PayrollDeductionType
                            const nextLabel =
                              payrollDeductionTypeOptions.find((option) => option.value === nextType)?.label ??
                              deduction.label

                            updatePayrollDeduction(deduction.id, {
                              type: nextType,
                              label: nextLabel,
                            })
                          }}
                          className="ui-input"
                        >
                          {payrollDeductionTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Label
                        </span>
                        <input
                          type="text"
                          value={deduction.label}
                          onChange={(event) =>
                            updatePayrollDeduction(deduction.id, {
                              label: event.target.value,
                            })
                          }
                          className="ui-input"
                          placeholder="WTax first cutoff"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={deduction.enabled}
                          onChange={(event) =>
                            updatePayrollDeduction(deduction.id, {
                              enabled: event.target.checked,
                            })
                          }
                        />
                        Enabled
                      </label>

                      <button
                        type="button"
                        onClick={() => removePayrollDeduction(deduction.id)}
                        className="ui-button-subtle"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[9rem_12rem_minmax(0,1fr)] md:items-end">
                    <label className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Amount
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={deduction.amount}
                        onChange={(event) =>
                          updatePayrollDeduction(deduction.id, {
                            amount: toNumber(event.target.value),
                          })
                        }
                        className="ui-input"
                        placeholder="0"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Applies to
                      </span>
                      <select
                        value={deduction.cutoffId ?? ''}
                        onChange={(event) =>
                          updatePayrollDeduction(deduction.id, {
                            cutoffId: event.target.value || undefined,
                          })
                        }
                        className="ui-input"
                        disabled={form.viewMode !== 'cutoff'}
                      >
                        <option value="">All / monthly</option>
                        {form.cutoffs
                          .filter((cutoff) => cutoff.isActive)
                          .map((cutoff) => (
                            <option key={cutoff.id} value={cutoff.id}>
                              {cutoff.label}
                            </option>
                          ))}
                      </select>
                    </label>

                    <p className="text-sm text-muted-foreground">
                      {form.viewMode === 'cutoff'
                        ? 'Assign this deduction to a specific cutoff if it only affects one payroll period.'
                        : 'In monthly mode, this deduction reduces the whole-month budget.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            id="cutoff-rules"
            className={getSectionClassName('cutoff-rules', 'surface-card rounded-[1.75rem] p-5 scroll-mt-24')}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Cutoff rules
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {form.viewMode === 'cutoff'
                    ? 'Define how your payroll cycle works so Tantiya can group spending correctly.'
                    : 'This section becomes active when you switch the budget cycle to cutoff tracking.'}
                </p>
              </div>
              <button
                type="button"
                onClick={addCutoff}
                disabled={form.viewMode !== 'cutoff'}
                className="public-outline-button px-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add cutoff
              </button>
            </div>

            <div className="mt-4">
              {form.viewMode !== 'cutoff' ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  You are currently using monthly budgeting, so cutoff rules are optional and won’t
                  affect your totals until you switch to cutoff tracking.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-border px-4 py-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Active cutoff for budget view</span>
                      <select
                        value={form.activeCutoffId ?? 'automatic'}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            activeCutoffId:
                              event.target.value === 'automatic' ? undefined : event.target.value,
                          }))
                        }
                        className="ui-input"
                      >
                        <option value="automatic">Automatic by today&apos;s date</option>
                        {activeCutoffs.map((cutoff) => (
                          <option key={cutoff.id} value={cutoff.id}>
                            {cutoff.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Leave this on automatic if today&apos;s date should decide the active cutoff.
                      Pick a specific cutoff if you want Tantiya to force the current budget view to
                      one payroll period.
                    </p>
                  </div>

                  <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {form.cutoffs.map((cutoff) => (
                    <div
                      key={cutoff.id}
                      className="rounded-2xl border border-border bg-card/60 p-4"
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end">
                        <label className="space-y-2">
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Cutoff label
                          </span>
                          <input
                            type="text"
                            value={cutoff.label}
                            onChange={(event) =>
                              updateCutoff(cutoff.id, { label: event.target.value })
                            }
                            className="ui-input"
                            placeholder="First cutoff"
                          />
                        </label>

                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                          <label className="flex items-center gap-2 text-sm text-foreground">
                            <input
                              type="checkbox"
                              checked={cutoff.isActive}
                              onChange={(event) =>
                                updateCutoff(cutoff.id, { isActive: event.target.checked })
                              }
                            />
                            Active
                          </label>

                          <button
                            type="button"
                            onClick={() => removeCutoff(cutoff.id)}
                            disabled={form.cutoffs.length <= 1}
                            className="ui-button-subtle disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <label className="space-y-2">
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Start day
                          </span>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={cutoff.startDay}
                            onChange={(event) =>
                              updateCutoff(cutoff.id, { startDay: toDayNumber(event.target.value) })
                            }
                            className="ui-input"
                            placeholder="1"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            End day
                          </span>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={cutoff.endDay}
                            onChange={(event) =>
                              updateCutoff(cutoff.id, { endDay: toDayNumber(event.target.value) })
                            }
                            className="ui-input"
                            placeholder="15"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Income amount
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={cutoff.expectedIncomeAmount}
                            onChange={(event) =>
                              updateCutoff(cutoff.id, {
                                expectedIncomeAmount: toNumber(event.target.value),
                              })
                            }
                            className="ui-input"
                            placeholder="16500"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Payout offset
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={cutoff.expectedPayoutOffsetDays ?? 0}
                            onChange={(event) =>
                              updateCutoff(cutoff.id, {
                                expectedPayoutOffsetDays: toNumber(event.target.value),
                              })
                            }
                            className="ui-input"
                            placeholder="10"
                          />
                        </label>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Enter the salary for this cutoff here. Example: `16500` for April 1-15
                        paid on April 25, then `18500` for April 16-30 paid on May 10.
                      </p>
                    </div>
                  ))}
                </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section
            id="housing"
            className={getSectionClassName('housing', 'surface-card rounded-[1.75rem] p-5 scroll-mt-24')}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Housing plan
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Track equity first, then let Tantiya switch to amortization when that phase becomes active.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.housingPlan.enabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      housingPlan: {
                        ...current.housingPlan,
                        enabled: event.target.checked,
                      },
                    }))
                  }
                />
                Enabled
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Housing label</span>
                <input
                  type="text"
                  value={form.housingPlan.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      housingPlan: {
                        ...current.housingPlan,
                        name: event.target.value,
                      },
                    }))
                  }
                  className="ui-input"
                  placeholder="House equity"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Phase</span>
                <select
                  value={form.housingPlan.phase}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      housingPlan: {
                        ...current.housingPlan,
                        phase: event.target.value as 'equity' | 'amortization',
                      },
                    }))
                  }
                  className="ui-input"
                >
                  <option value="equity">Equity is current</option>
                  <option value="amortization">Amortization is current</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Choose the phase that should be used now in your active budget.
                </p>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Start date</span>
                <input
                  type="date"
                  value={form.housingPlan.startDate ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      housingPlan: {
                        ...current.housingPlan,
                        startDate: event.target.value || undefined,
                      },
                    }))
                  }
                  className="ui-input"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Equity amount used while equity is active</span>
                <input
                  type="number"
                  min="0"
                  value={form.housingPlan.equityAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      housingPlan: {
                        ...current.housingPlan,
                        equityAmount: toNumber(event.target.value),
                      },
                    }))
                  }
                  className="ui-input"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Equity months</span>
                <input
                  type="number"
                  min="0"
                  value={form.housingPlan.equityMonths}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      housingPlan: {
                        ...current.housingPlan,
                        equityMonths: toNumber(event.target.value),
                      },
                    }))
                  }
                  className="ui-input"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Months already paid</span>
                <input
                  type="number"
                  min="0"
                  value={form.housingPlan.equityMonthsPaid}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      housingPlan: {
                        ...current.housingPlan,
                        equityMonthsPaid: toNumber(event.target.value),
                      },
                    }))
                  }
                  className="ui-input"
                />
                <p className="text-sm text-muted-foreground">
                  When this reaches the total equity months, Tantiya will stop using the equity amount.
                </p>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Future amortization amount</span>
                <input
                  type="number"
                  min="0"
                  value={form.housingPlan.amortizationAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      housingPlan: {
                        ...current.housingPlan,
                        amortizationAmount: toNumber(event.target.value),
                      },
                    }))
                  }
                  className="ui-input"
                />
                <p className="text-sm text-muted-foreground">
                  You can enter this now even if equity is not finished yet. It will only be used once amortization becomes the active phase.
                </p>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Apply housing to</span>
                <select
                  value={
                    form.viewMode !== 'cutoff'
                      ? 'whole-month'
                      : form.housingPlan.budgetApplication === 'specific-cutoff'
                        ? form.housingPlan.cutoffId ?? 'whole-month'
                        : form.housingPlan.budgetApplication
                  }
                  onChange={(event) =>
                    setForm((current) => {
                      const value = event.target.value

                      return {
                        ...current,
                        housingPlan: {
                          ...current.housingPlan,
                          budgetApplication:
                            value === 'split-across-cutoffs'
                              ? 'split-across-cutoffs'
                              : value === 'whole-month'
                                ? 'whole-month'
                                : 'specific-cutoff',
                          cutoffId:
                            value === 'split-across-cutoffs' || value === 'whole-month'
                              ? undefined
                              : value,
                        },
                      }
                    })
                  }
                  className="ui-input"
                  disabled={form.viewMode !== 'cutoff'}
                >
                  <option value="whole-month">Whole month</option>
                  {form.viewMode === 'cutoff' && (
                    <option value="split-across-cutoffs">
                      Split across active cutoffs
                    </option>
                  )}
                  {form.viewMode === 'cutoff' &&
                    activeCutoffs.map((cutoff) => (
                      <option key={cutoff.id} value={cutoff.id}>
                        {cutoff.label}
                      </option>
                    ))}
                </select>
                <p className="text-sm text-muted-foreground">
                  Use `Whole month` if housing should stay as one monthly obligation. Use `Split across active cutoffs` if you want amounts like `10,000 / 2 = 5,000` reflected inside each cutoff.
                </p>
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-4">
              <p className="text-sm font-medium text-foreground">Currently used in budget</p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                PHP {activeHousingAmount.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {housingStatusCopy}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {housingApplicationCopy}
              </p>
            </div>
          </section>

          <section
            id="preview"
            className={getSectionClassName('preview', 'surface-card rounded-[1.75rem] p-5 scroll-mt-24')}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Current preview
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Use this to sanity-check your current live budget before you save changes.
            </p>
            {form.viewMode === 'cutoff' && (
              <div className="mt-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Preview budget for</span>
                  <select
                    value={previewScope}
                    onChange={(event) => setPreviewScope(event.target.value)}
                    className="ui-input"
                  >
                    <option value="whole-month">Whole month</option>
                    <option value="current-cutoff">Current cutoff</option>
                    {activeCutoffs.map((cutoff) => (
                      <option key={cutoff.id} value={cutoff.id}>
                        {cutoff.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Preview scope</span>
                <span className="font-semibold text-foreground">{previewData.label}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Income target</span>
                <span className="font-semibold text-foreground">
                  PHP {previewData.income.toLocaleString()}
                </span>
              </div>
              {form.viewMode === 'cutoff' && previewScope === 'whole-month' && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  <span className="text-muted-foreground">Monthly reference only</span>
                  <span className="font-semibold text-foreground">
                    PHP {form.monthlyIncomeTarget.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Allowance</span>
                <span className="font-semibold text-foreground">
                  PHP {previewData.allowance.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Fixed expenses</span>
                <span className="font-semibold text-foreground">PHP {previewData.fixed.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Payroll deductions</span>
                <span className="font-semibold text-foreground">PHP {previewData.payroll.toLocaleString()}</span>
              </div>
              {form.viewMode === 'cutoff' && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  <span className="text-muted-foreground">Carryover to cutoff</span>
                  <span className="font-semibold text-foreground">
                    PHP {previewData.carryover.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Housing active</span>
                <span className="font-semibold text-foreground">
                  {form.housingPlan.enabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Housing used now</span>
                <span className="font-semibold text-foreground">
                  PHP {previewData.housing.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Reserved savings</span>
                <span className="font-semibold text-foreground">
                  PHP {previewData.savings.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Budget cycle</span>
                <span className="font-semibold capitalize text-foreground">{form.viewMode}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">
                  {form.viewMode === 'cutoff' ? 'Active cutoffs' : 'Configured cutoffs'}
                </span>
                <span className="font-semibold text-foreground">
                  {form.viewMode === 'cutoff' ? activeCutoffs.length : 'Not used'}
                </span>
              </div>
              <div className="rounded-2xl border border-dashed border-border px-4 py-4">
                <p className="text-sm font-medium text-foreground">Current remaining budget preview</p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                  PHP {previewData.remaining.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {previewData.note}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={saveSetup} className="public-primary-button px-5">
                {saveState === 'saved' ? 'Saved' : 'Save setup'}
              </button>
              <button
                type="button"
                onClick={() => jumpToSection('income')}
                className="public-outline-button px-5"
              >
                Back to top
              </button>
            </div>
          </section>
        </div>
      </div>

      {isCompactSetup && (
        <div className="sticky bottom-4 z-30">
          <div className="surface-card mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-[0_20px_40px_rgba(15,23,42,0.12)]">
            <button
              type="button"
              onClick={() => previousSectionId && jumpToSection(previousSectionId)}
              disabled={!previousSectionId}
              className="public-outline-button px-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>

            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {setupSections[activeSectionIndex]?.title ?? 'Setup'}
              </p>
              <p className="text-xs text-muted-foreground">
                {setupSections[activeSectionIndex]?.status ?? 'Review this section'}
              </p>
            </div>

            {nextSectionId ? (
              <button
                type="button"
                onClick={() => jumpToSection(nextSectionId)}
                className="public-primary-button px-4"
              >
                Next
              </button>
            ) : (
              <button type="button" onClick={saveSetup} className="public-primary-button px-4">
                {saveState === 'saved' ? 'Saved' : 'Save'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { exportBudgetData } from '@/features/budget/storage'
import { useBudgetStore } from '@/hooks/useBudgetStore'

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function SettingsPage() {
  const { budgetData, snapshot, restoreFromBackup } = useBudgetStore()
  const [importState, setImportState] = useState<'idle' | 'importing' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const [exportState, setExportState] = useState<'idle' | 'done'>('idle')

  const backupFilename = useMemo(() => {
    const stamp = new Date().toISOString().slice(0, 10)
    return `tantiya-backup-${stamp}.json`
  }, [])

  const stats = useMemo(
    () => ({
      incomes: budgetData.incomes.length,
      expenses: budgetData.expenses.length,
      fixedExpenses: budgetData.settings.fixedExpenses.length,
      cutoffs: budgetData.settings.cutoffs.filter((cutoff) => cutoff.isActive).length,
      presets: budgetData.settings.quickAmountPresets.length,
    }),
    [budgetData],
  )

  const handleExport = () => {
    const raw = exportBudgetData(budgetData)
    downloadTextFile(backupFilename, raw)
    setExportState('done')
    window.setTimeout(() => setExportState('idle'), 1800)
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportState('importing')
    setImportMessage('')

    try {
      const contents = await file.text()
      restoreFromBackup(contents)
      setImportState('success')
      setImportMessage('Backup imported successfully. Your local workspace is now updated.')
    } catch {
      setImportState('error')
      setImportMessage('The selected file could not be imported. Please choose a valid Tantiya backup JSON.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section className="space-y-6">
      <section className="surface-card rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] p-6 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700 dark:text-amber-300">
          Settings
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">
          Backup, restore, and workspace safety.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          Tantiya stores everything in local storage, so this page is where you protect your data,
          restore older snapshots, and reset the local workspace safely when needed.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <section className="surface-card rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Export backup
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Download your current Tantiya data as a JSON backup file.
                </p>
              </div>
              <button type="button" onClick={handleExport} className="public-primary-button px-5">
                {exportState === 'done' ? 'Backup downloaded' : 'Export JSON'}
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-4">
              <p className="text-sm font-medium text-foreground">Backup file name</p>
              <p className="mt-2 text-sm text-muted-foreground">{backupFilename}</p>
            </div>
          </section>

          <section className="surface-card rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Import backup
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Restore a previously exported Tantiya backup JSON into this browser.
                </p>
              </div>
            </div>

            <label className="mt-4 flex cursor-pointer flex-col items-start gap-3 rounded-2xl border border-border bg-card/60 px-4 py-4 transition-colors hover:bg-accent">
              <span className="public-outline-button px-5">
                {importState === 'importing' ? 'Importing...' : 'Choose backup file'}
              </span>
              <span className="text-sm text-muted-foreground">
                Import replaces the current local workspace with the selected backup content.
              </span>
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                className="sr-only"
              />
            </label>

            {importMessage && (
              <div
                className={[
                  'mt-4 rounded-2xl border px-4 py-3 text-sm',
                  importState === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
                ].join(' ')}
              >
                {importMessage}
              </div>
            )}
          </section>

        </div>

        <div className="space-y-4">
          <section className="surface-card rounded-[1.75rem] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Current storage snapshot
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Budget cycle</span>
                <span className="font-semibold capitalize text-foreground">
                  {budgetData.settings.viewMode}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Monthly income target</span>
                <span className="font-semibold text-foreground">
                  PHP {budgetData.settings.monthlyIncomeTarget.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Remaining budget</span>
                <span className="font-semibold text-foreground">
                  PHP {snapshot.totals.remainingBudget.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Saved expenses</span>
                <span className="font-semibold text-foreground">{stats.expenses}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Saved incomes</span>
                <span className="font-semibold text-foreground">{stats.incomes}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Fixed expenses</span>
                <span className="font-semibold text-foreground">{stats.fixedExpenses}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Active cutoffs</span>
                <span className="font-semibold text-foreground">{stats.cutoffs}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Quick presets</span>
                <span className="font-semibold text-foreground">{stats.presets}</span>
              </div>
            </div>
          </section>

          <section className="surface-card rounded-[1.75rem] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Backup reminders
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Export a backup before making big setup changes or before clearing local data.</p>
              <p>Keep your latest JSON in a safe folder or cloud drive so you can restore it anytime.</p>
              <p>Importing a backup replaces the current local workspace in this browser.</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

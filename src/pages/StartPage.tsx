import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { importBudgetData, readBudgetData } from '@/features/budget/storage'

const hasExistingBudget = () => {
  const data = readBudgetData()

  return (
    data.incomes.length > 0 ||
    data.expenses.length > 0 ||
    data.settings.monthlyIncomeTarget > 0 ||
    data.settings.fixedExpenses.length > 0 ||
    data.settings.housingPlan.enabled
  )
}

export default function StartPage() {
  const navigate = useNavigate()
  const [importError, setImportError] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const canContinue = useMemo(() => hasExistingBudget(), [])

  const openTantiya = () => {
    navigate(canContinue ? '/dashboard' : '/setup')
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError('')
    setIsImporting(true)

    try {
      const contents = await file.text()
      importBudgetData(contents)
      navigate('/dashboard')
    } catch {
      setImportError('The selected file could not be imported. Please use a valid Tantiya backup JSON.')
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_24rem]">
        <div className="public-panel bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(243,239,226,0.32),rgba(16,185,129,0.06))] p-8 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(168,162,158,0.02),rgba(16,185,129,0.05))] sm:p-10">
          <p className="public-eyebrow">
            Start your workspace
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-[-0.06em] text-foreground sm:text-5xl">
            Enter Tantiya the way that matches your current situation.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Open your saved local workspace right away, or restore a backup JSON if you are moving
            back into an older Tantiya snapshot.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={openTantiya}
              className="public-dark-panel rounded-[1.75rem] p-6 text-left transition duration-200 hover:-translate-y-0.5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-200">
                Main access
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em]">Open Tantiya</h2>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                {canContinue
                  ? 'Open your current local workspace and continue with the latest saved budget.'
                  : 'No saved workspace was found yet, so Tantiya will send you to setup first.'}
              </p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-stone-300">
                {canContinue
                  ? 'Detected local data. You can continue without importing anything.'
                  : 'Fresh start detected. Setup will become your first guided step.'}
              </div>
            </button>

            <label className="public-muted-panel flex cursor-pointer flex-col rounded-[1.75rem] p-6 text-left text-foreground transition duration-200 hover:-translate-y-0.5">
              <p className="public-eyebrow">
                Backup restore
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">Import backup</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Choose a previously exported Tantiya JSON file and restore that snapshot into this browser.
              </p>
              <div className="mt-5 rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                Import is best when you already backed up another Tantiya session and want to continue from it.
              </div>
              <span className="public-primary-button mt-5 px-5">
                {isImporting ? 'Importing...' : 'Select backup file'}
              </span>
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                className="sr-only"
              />
            </label>
          </div>

          {importError && (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {importError}
            </p>
          )}
        </div>

        <aside className="public-muted-panel p-6">
          <p className="public-eyebrow">
            Quick guide
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
            What happens next?
          </h2>
          <div className="mt-5 space-y-3">
            {[
              {
                title: 'Open Tantiya',
                body: canContinue
                  ? 'You already have local data, so this opens the dashboard and keeps your current workspace intact.'
                  : 'No meaningful local data exists yet, so this routes you to setup first.',
              },
              {
                title: 'Import backup',
                body: 'Use this only when you already exported a Tantiya JSON file and want to restore that exact snapshot.',
              },
              {
                title: 'Still safe later',
                body: 'You can still import and export anytime from Settings once you are inside the dashboard.',
              },
            ].map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card/55 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Step {index + 1}
                </p>
                <p className="mt-2 font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>

          <Link to="/" className="public-outline-button mt-6 px-5">
            Back to landing
          </Link>
        </aside>
      </div>
    </section>
  )
}

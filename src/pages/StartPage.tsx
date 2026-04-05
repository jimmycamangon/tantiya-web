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
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_24rem]">
      <div className="public-panel bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(243,239,226,0.32))] p-8 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(168,162,158,0.02))] sm:p-10">
        <p className="public-eyebrow">
          Start your workspace
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-[-0.06em] text-foreground sm:text-5xl">
          Choose how you want to enter Tantiya.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Open your current workspace or begin setup automatically, or import a backup JSON if you
          are restoring an older snapshot.
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
                ? 'Open your existing local budget workspace and continue where you left off.'
                : 'No saved workspace found yet, so Tantiya will guide you to setup first.'}
            </p>
          </button>

          <label className="public-muted-panel cursor-pointer rounded-[1.75rem] p-6 text-left text-foreground transition duration-200 hover:-translate-y-0.5">
            <p className="public-eyebrow">
              Backup restore
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">Import backup</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Choose a saved Tantiya JSON file and continue from that snapshot.
            </p>
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
          Recommended
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
          Start with setup if you are new here.
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>`Open Tantiya` sends you to the dashboard if local data already exists.</p>
          <p>If no meaningful data is found yet, `Open Tantiya` sends you to setup instead.</p>
          <p>Import is best if you already exported a backup from an older Tantiya session.</p>
          <p>You can still import and export later from the Settings page inside the dashboard.</p>
        </div>

        <Link to="/" className="public-outline-button mt-6 px-5">
          Back to landing
        </Link>
      </aside>
    </section>
  )
}

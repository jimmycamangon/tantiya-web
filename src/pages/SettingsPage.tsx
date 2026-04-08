import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { exportBudgetData } from '@/features/budget/storage'
import { BUDGET_STORAGE_KEY } from '@/features/budget/constants'
import { useBudgetStore } from '@/hooks/useBudgetStore'
import {
  getDefaultUserProfile,
  getProfileInitials,
  readUserProfile,
  saveUserProfile,
} from '@/lib/userPreference'
import type { UserProfile } from '@/types/userProfile'

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const formatStorageSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function SettingsPage() {
  const { budgetData, snapshot, restoreFromBackup } = useBudgetStore()
  const [importState, setImportState] = useState<'idle' | 'importing' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const [exportState, setExportState] = useState<'idle' | 'done'>('idle')
  const [profileForm, setProfileForm] = useState<UserProfile>(() => readUserProfile())
  const [profileState, setProfileState] = useState<'idle' | 'saved'>('idle')

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

  const storageSnapshot = useMemo(() => {
    const rawBudgetJson = exportBudgetData(budgetData)
    const rawStoredValue =
      typeof window !== 'undefined' ? window.localStorage.getItem(BUDGET_STORAGE_KEY) ?? rawBudgetJson : rawBudgetJson
    const profileJson =
      typeof window !== 'undefined' ? window.localStorage.getItem('tantiya_user_profile') ?? '' : ''
    const budgetBytes = new Blob([rawStoredValue]).size
    const profileBytes = new Blob([profileJson]).size
    const totalBytes = budgetBytes + profileBytes
    const estimatedLimitBytes = 5 * 1024 * 1024
    const usagePercent = Math.min((totalBytes / estimatedLimitBytes) * 100, 100)

    return {
      budgetBytes,
      profileBytes,
      totalBytes,
      estimatedLimitBytes,
      usagePercent,
    }
  }, [budgetData])

  const profileInitials = useMemo(() => getProfileInitials(profileForm), [profileForm])

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

  const handleProfileSave = () => {
    saveUserProfile({
      ...profileForm,
      fullName: profileForm.fullName.trim() || getDefaultUserProfile().fullName,
      title: profileForm.title.trim() || getDefaultUserProfile().title,
      focusArea: profileForm.focusArea.trim(),
      bio: profileForm.bio.trim(),
    })
    setProfileState('saved')
    window.setTimeout(() => setProfileState('idle'), 1800)
  }

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setProfileForm((current) => ({
        ...current,
        avatarDataUrl: result,
      }))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const removeAvatar = () => {
    setProfileForm((current) => ({
      ...current,
      avatarDataUrl: '',
    }))
  }

  const resetProfile = () => {
    setProfileForm(getDefaultUserProfile())
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
                  Profile
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Update the name, role, and photo shown in your Tantiya dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={handleProfileSave}
                className="public-primary-button px-5"
              >
                {profileState === 'saved' ? 'Profile saved' : 'Save profile'}
              </button>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.55fr)]">
              <div className="space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Full name</span>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    className="ui-input"
                    placeholder="Your full name"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Role or title</span>
                  <input
                    type="text"
                    value={profileForm.title}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="ui-input"
                    placeholder="Budget Planner"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Focus line</span>
                  <input
                    type="text"
                    value={profileForm.focusArea}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        focusArea: event.target.value,
                      }))
                    }
                    className="ui-input"
                    placeholder="One-line budget focus"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Short bio</span>
                  <textarea
                    value={profileForm.bio}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        bio: event.target.value,
                      }))
                    }
                    className="ui-input min-h-28 resize-y"
                    placeholder="A short description shown for your Tantiya profile."
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <p className="text-sm font-medium text-foreground">Profile preview</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-muted text-xl font-bold text-foreground">
                    {profileForm.avatarDataUrl ? (
                      <img
                        src={profileForm.avatarDataUrl}
                        alt={`${profileForm.fullName} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profileInitials
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-foreground">
                      {profileForm.fullName || 'Tantiya User'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profileForm.title || 'Budget Planner'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer flex-col items-start gap-3 rounded-2xl border border-border bg-background/60 px-4 py-4 transition-colors hover:bg-accent">
                    <span className="public-outline-button px-5">Upload profile image</span>
                    <span className="text-sm text-muted-foreground">
                      JPG and PNG work well. The image is stored only in this browser.
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarUpload}
                      className="sr-only"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={removeAvatar} className="ui-button-subtle">
                      Remove image
                    </button>
                    <button type="button" onClick={resetProfile} className="ui-button-subtle">
                      Reset profile fields
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

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

            <div className="mt-5 rounded-2xl border border-dashed border-border px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Estimated storage usage</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Approximate browser usage for Tantiya budget data and profile info.
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                  {storageSnapshot.usagePercent.toFixed(1)}%
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-700 dark:bg-emerald-500"
                  style={{ width: `${Math.max(storageSnapshot.usagePercent, 2)}%` }}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Budget data</p>
                  <p className="mt-2 font-semibold text-foreground">
                    {formatStorageSize(storageSnapshot.budgetBytes)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Profile data</p>
                  <p className="mt-2 font-semibold text-foreground">
                    {formatStorageSize(storageSnapshot.profileBytes)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estimated total</p>
                  <p className="mt-2 font-semibold text-foreground">
                    {formatStorageSize(storageSnapshot.totalBytes)}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Browsers often allow around {formatStorageSize(storageSnapshot.estimatedLimitBytes)} for localStorage per site. Tantiya can usually store years of normal budget records, but large profile images and very long histories will use space faster.
              </p>
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

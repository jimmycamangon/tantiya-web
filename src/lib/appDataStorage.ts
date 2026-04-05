import type { AppData } from '../types/appData'

export const APP_DATA_STORAGE_KEY = 'tuloylang_app_data'

const defaultAppData: AppData = {
  version: 3,
}

function normalizeAppData(value: unknown): AppData {
  const parsed = value as Partial<AppData>

  return {
    version: typeof parsed.version === 'number' ? parsed.version : 3,
  }
}

export function readAppData(): AppData {
  const saved = localStorage.getItem(APP_DATA_STORAGE_KEY)
  if (!saved) return defaultAppData

  try {
    return normalizeAppData(JSON.parse(saved))
  } catch {
    return defaultAppData
  }
}

export function saveAppData(appData: AppData) {
  localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData))
}

export function importAppData(jsonText: string) {
  const parsed = JSON.parse(jsonText) as unknown
  const nextData = normalizeAppData(parsed)

  saveAppData(nextData)
  return nextData
}

export function exportAppData() {
  return JSON.stringify(readAppData(), null, 2)
}

export function downloadAppDataFile() {
  const fileContents = exportAppData()
  const blob = new Blob([fileContents], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const dateStamp = new Date().toISOString().slice(0, 10)

  link.href = url
  link.download = `tuloylang-backup-${dateStamp}.json`
  link.click()

  URL.revokeObjectURL(url)
}



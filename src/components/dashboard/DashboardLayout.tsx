import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Footer from '../Footer'
import {
  getProfileInitials,
  readNavExpandedPreference,
  readThemePreference,
  readUserProfile,
  saveNavExpandedPreference,
  saveThemePreference,
  USER_PROFILE_UPDATED_EVENT,
} from '../../lib/userPreference'
import DashboardSidebar from './DashboardSidebar'
import DashboardTopbar from './DashboardTopbar'
import { routeMeta } from './dashboardConfig'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const [expanded, setExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [isDark, setIsDark] = useState(() => readThemePreference() === 'dark')
  const [profile, setProfile] = useState(readUserProfile)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const commandItemRefs = useRef<Array<HTMLButtonElement | null>>([])

  const sidebarWidth = expanded ? 'w-72' : 'w-20'
  const commandItems = useMemo(() => Object.values(routeMeta), [])

  const pathToId = useMemo(() => {
    const map: Record<string, string> = {}
    Object.entries(routeMeta).forEach(([id, meta]) => {
      map[meta.path] = id
    })
    return map
  }, [])

  const activeId = pathToId[location.pathname] ?? 'dashboard'
  const currentRoute = routeMeta[activeId] ?? routeMeta.dashboard
  const breadcrumbTrail = currentRoute.breadcrumbs
    .map((id) => routeMeta[id])
    .filter((meta): meta is (typeof routeMeta)[keyof typeof routeMeta] => Boolean(meta))

  const filteredCommandItems = useMemo(() => {
    const q = commandQuery.trim().toLowerCase()
    if (!q) return commandItems

    return commandItems.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(q)
      const inPath = item.path.toLowerCase().includes(q)
      const inCrumbs = item.breadcrumbs.join(' ').toLowerCase().includes(q)
      return inTitle || inPath || inCrumbs
    })
  }, [commandItems, commandQuery])

  useEffect(() => {
    setExpanded(readNavExpandedPreference())
    setProfile(readUserProfile())
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    saveThemePreference(isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    saveNavExpandedPreference(expanded)
  }, [expanded])

  useEffect(() => {
    function syncProfile() {
      setProfile(readUserProfile())
    }

    window.addEventListener('storage', syncProfile)
    window.addEventListener('focus', syncProfile)
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, syncProfile)
    return () => {
      window.removeEventListener('storage', syncProfile)
      window.removeEventListener('focus', syncProfile)
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, syncProfile)
    }
  }, [])

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      const isCmdK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
      if (isCmdK) {
        event.preventDefault()
        openCommandPalette()
      }

      if (event.key === 'Escape') {
        setShowCommandPalette(false)
      }
    }

    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [commandQuery, showCommandPalette])

  useEffect(() => {
    if (!showCommandPalette) return
    const item = commandItemRefs.current[highlightedIndex]
    if (item) item.scrollIntoView({ block: 'nearest' })
  }, [filteredCommandItems, highlightedIndex, showCommandPalette])

  function handleNavigate(id: string) {
    const path = routeMeta[id]?.path
    if (path && location.pathname !== path) {
      navigate(path)
    }

    setShowProfileMenu(false)
    setMobileOpen(false)
  }

  function confirmExitToHome() {
    setShowExitConfirm(false)
    setShowProfileMenu(false)
    setMobileOpen(false)
    navigate('/', { replace: true })
  }

  function openCommandPalette() {
    setShowCommandPalette(true)
    setCommandQuery('')
    setHighlightedIndex(0)
  }

  function closeCommandPalette() {
    setShowCommandPalette(false)
    setCommandQuery('')
    setHighlightedIndex(0)
  }

  function navigateFromCommand(path: string) {
    if (location.pathname !== path) {
      navigate(path)
    }

    setMobileOpen(false)
    closeCommandPalette()
  }

  return (
    <div className="app-shell">
      <div className="flex w-full">
        <aside
          className={`sidebar-shell relative z-30 hidden min-h-screen flex-col overflow-visible transition-all duration-300 md:flex ${sidebarWidth}`}
        >
          <DashboardSidebar
            activeId={activeId}
            expanded={expanded}
            onToggleExpanded={() => setExpanded((prev) => !prev)}
            onNavigate={handleNavigate}
            profile={profile}
            profileInitials={getProfileInitials(profile)}
          />
        </aside>

        <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${
            mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <button
            type="button"
            aria-label="Close mobile menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/35"
          />
          <aside
            className={`sidebar-shell relative flex h-full w-72 flex-col overflow-y-auto overscroll-contain shadow-xl transition-transform duration-300 ease-out ${
              mobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <DashboardSidebar
              activeId={activeId}
              expanded
              mobile
              onToggleExpanded={() => setMobileOpen(false)}
              onNavigate={handleNavigate}
              profile={profile}
              profileInitials={getProfileInitials(profile)}
            />
          </aside>
        </div>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <DashboardTopbar
            currentRoute={currentRoute}
            isDark={isDark}
            onOpenMobile={() => setMobileOpen(true)}
            onToggleExpanded={() => setExpanded((prev) => !prev)}
            onOpenCommandPalette={openCommandPalette}
            onToggleTheme={() => setIsDark((prev) => !prev)}
            showProfileMenu={showProfileMenu}
            onToggleProfileMenu={() => setShowProfileMenu((prev) => !prev)}
            onNavigateSettings={() => handleNavigate('settings')}
            onOpenExitConfirm={() => {
              setShowProfileMenu(false)
              setShowExitConfirm(true)
            }}
            profileMenuRef={profileMenuRef}
            profile={profile}
            profileInitials={getProfileInitials(profile)}
          />

          <main className="relative z-0 w-full flex-1 p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="muted-copy flex flex-wrap items-center gap-1 text-sm">
              {breadcrumbTrail.map((crumb, index) => {
                const isLast = index === breadcrumbTrail.length - 1
                return (
                  <span key={`${crumb.path}-${index}`} className="inline-flex items-center gap-1">
                    {index > 0 && <span className="text-muted-foreground/70">/</span>}
                    {isLast ? (
                      <span className="font-medium text-foreground">{crumb.title}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(crumb.path)}
                        className="cursor-pointer rounded px-1 py-0.5 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {crumb.title}
                      </button>
                    )}
                  </span>
                )
              })}
              </div>
              <span className="hidden rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground lg:inline-flex">
                Local-first workspace
              </span>
            </div>

            <Outlet />
          </main>

          <Footer />
        </div>
      </div>

      {showCommandPalette && (
        <div className="fixed inset-0 z-[65] flex items-start justify-center bg-slate-900/40 p-4 pt-20">
          <div className="surface-card w-full max-w-xl shadow-xl">
            <div className="border-b border-border p-3">
              <input
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setHighlightedIndex((prev) =>
                      Math.min(prev + 1, Math.max(filteredCommandItems.length - 1, 0)),
                    )
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setHighlightedIndex((prev) => Math.max(prev - 1, 0))
                  }
                  if (e.key === 'Enter' && filteredCommandItems[highlightedIndex]) {
                    e.preventDefault()
                    navigateFromCommand(filteredCommandItems[highlightedIndex].path)
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    closeCommandPalette()
                  }
                }}
                placeholder="Search pages... (Ctrl+K)"
                className="ui-input"
              />
            </div>

            <div className="max-h-80 overflow-auto p-2">
              {filteredCommandItems.length === 0 ? (
                <p className="muted-copy px-2 py-4 text-sm">No matches found.</p>
              ) : (
                filteredCommandItems.map((item, index) => {
                  const isHighlighted = index === highlightedIndex
                  return (
                    <button
                      key={`command-${item.path}`}
                      ref={(el) => {
                        commandItemRefs.current[index] = el
                      }}
                      type="button"
                      onClick={() => navigateFromCommand(item.path)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`mb-1 w-full rounded-md px-3 py-2 text-left transition-colors ${
                        isHighlighted ? 'command-item-active' : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="muted-copy text-xs">{item.path}</p>
                    </button>
                  )
                })
              )}
            </div>

            <div className="muted-copy border-t border-border px-3 py-2 text-xs">
              Jump across your Tantiya pages with <span className="font-medium">Up/Down</span>,{' '}
              <span className="font-medium">Enter</span> to open,{' '}
              <span className="font-medium">Esc</span> to close.
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="surface-card w-full max-w-sm p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Back To Home</h3>
            <p className="muted-copy mt-2 text-sm">
              This will return you to the landing page. Your Tantiya data saved in local storage
              will stay intact.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="ui-button py-2"
              >
                Cancel
              </button>
              <button type="button" onClick={confirmExitToHome} className="ui-button">
                Back to home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import type { RefObject } from 'react'
import { Home, Menu, Moon, Search, Sun } from 'lucide-react'
import type { RouteMeta } from './dashboardConfig'
import type { UserProfile } from '../../types/userProfile'

type DashboardTopbarProps = {
  currentRoute: RouteMeta
  isDark: boolean
  onOpenMobile: () => void
  onToggleExpanded: () => void
  onOpenCommandPalette: () => void
  onToggleTheme: () => void
  showProfileMenu: boolean
  onToggleProfileMenu: () => void
  onNavigateSettings: () => void
  onOpenExitConfirm: () => void
  profileMenuRef: RefObject<HTMLDivElement | null>
  profile: UserProfile
  profileInitials: string
}

export default function DashboardTopbar({
  currentRoute,
  isDark,
  onOpenMobile,
  onToggleExpanded,
  onOpenCommandPalette,
  onToggleTheme,
  showProfileMenu,
  onToggleProfileMenu,
  onNavigateSettings,
  onOpenExitConfirm,
  profileMenuRef,
  profile,
  profileInitials,
}: DashboardTopbarProps) {
  const todayLabel = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header className="top-nav-shell relative z-40 flex h-16 items-center justify-between overflow-visible px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (window.matchMedia('(max-width: 767px)').matches) onOpenMobile()
            else onToggleExpanded()
          }}
          className="ui-icon-button cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:inline-flex">
              Tantiya
            </span>
            <h1 className="truncate text-lg font-semibold leading-tight text-foreground">
              {currentRoute.title}
            </h1>
          </div>
          <div className="mt-0.5 hidden items-center gap-2 text-sm md:flex">
            <p className="muted-copy">
              {currentRoute.description ?? 'Manage your Tantiya budget workspace.'}
            </p>
            <span className="text-muted-foreground/40">•</span>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {todayLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="ui-icon-button md:hidden"
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="ui-button-subtle hidden md:inline-flex"
        >
          Search
          <span className="muted-copy ml-2 rounded border border-border px-1.5 text-[11px]">
            Ctrl+K
          </span>
        </button>
        <button type="button" onClick={onToggleTheme} className="ui-button">
          {isDark ? <Sun className="mx-auto h-4 w-4" /> : <Moon className="mx-auto h-4 w-4" />}
        </button>

        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            onClick={onToggleProfileMenu}
            className="inline-flex items-center gap-2 overflow-hidden rounded-full border border-border bg-card px-1 py-1 transition-colors hover:bg-accent"
            aria-label="Open profile menu"
          >
            {profile.avatarDataUrl ? (
              <img
                src={profile.avatarDataUrl}
                alt={`${profile.fullName} avatar`}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-foreground">
                {profileInitials}
              </span>
            )}
            <span className="hidden pr-2 text-left md:block">
              <span className="block max-w-[10rem] truncate text-xs font-semibold text-foreground">
                {profile.fullName}
              </span>
              <span className="block max-w-[10rem] truncate text-[11px] text-muted-foreground">
                {profile.title}
              </span>
            </span>
          </button>

          {showProfileMenu && (
            <div className="surface-card absolute right-0 top-14 z-50 w-64 p-2 shadow-xl">
              <div className="rounded-xl bg-muted/50 px-3 py-3">
                <p className="text-sm font-semibold text-foreground">{profile.fullName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{profile.title}</p>
                {profile.focusArea && (
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{profile.focusArea}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onNavigateSettings}
                className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
              >
                Settings and backup
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={onOpenExitConfirm}
                className="ui-button-subtle flex w-full items-center justify-start gap-2"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

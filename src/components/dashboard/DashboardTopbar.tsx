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
  return (
    <header className="top-nav-shell flex h-16 items-center justify-between px-6">
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
          <h1 className="truncate text-lg font-semibold leading-tight text-foreground">
            {currentRoute.title}
          </h1>
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
            className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card transition-colors hover:bg-accent"
            aria-label="Open profile menu"
          >
            {profile.avatarDataUrl ? (
              <img
                src={profile.avatarDataUrl}
                alt={`${profile.fullName} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-foreground">{profileInitials}</span>
            )}
          </button>

          {showProfileMenu && (
            <div className="surface-card absolute right-0 top-12 z-50 w-52 p-2 shadow-xl">
              <button
                type="button"
                onClick={onNavigateSettings}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
              >
                Settings
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={onOpenExitConfirm}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
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

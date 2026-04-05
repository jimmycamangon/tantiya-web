import { navItems, routeMeta } from './dashboardConfig'
import type { UserProfile } from '../../types/userProfile'

type DashboardSidebarProps = {
  activeId: string
  expanded: boolean
  mobile?: boolean
  onToggleExpanded: () => void
  onNavigate: (id: string) => void
  profile: UserProfile
  profileInitials: string
}

export default function DashboardSidebar({
  activeId,
  expanded,
  mobile = false,
  onToggleExpanded,
  onNavigate,
  profile,
  profileInitials,
}: DashboardSidebarProps) {
  const showFullLogo = mobile || expanded

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border p-3">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent"
          aria-label="Toggle logo details"
        >
          {showFullLogo ? (
            <img
              src="/TuloyLang-Logov2.png"
              alt="logo"
              className="h-7 w-auto object-contain dark:invert"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-md">
              <img
                src="/TuloyLangIcon.png"
                alt="icon"
                className="h-7 w-auto object-contain dark:invert"
              />
            </div>
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-2 overflow-visible p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeId === item.id
          const canShowDetails = expanded || mobile

          return (
            <div key={item.id} className="relative space-y-1">
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`nav-item-base ${isActive ? 'nav-item-active' : 'nav-item-idle'}`}
              >
                <span className="nav-icon-chip">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>

                {canShowDetails && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="muted-copy block truncate text-xs">
                      {routeMeta[item.id]?.description ?? item.detail}
                    </span>
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-md bg-muted p-2">
          {profile.avatarDataUrl ? (
            <img
              src={profile.avatarDataUrl}
              alt={`${profile.fullName} avatar`}
              className="h-9 w-9 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-xs font-semibold text-foreground">
              {profileInitials}
            </div>
          )}
          {(expanded || mobile) && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{profile.fullName}</p>
              <p className="muted-copy truncate text-xs">{profile.title}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

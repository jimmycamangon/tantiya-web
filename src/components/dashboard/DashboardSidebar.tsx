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
  const collapsed = !showFullLogo

  return (
    <>
      <div className="border-b border-border p-3">
        <button
          type="button"
          onClick={onToggleExpanded}
          className={[
            'flex w-full min-w-0 cursor-pointer items-center rounded-2xl border border-border/70 bg-card/50 py-3 text-left transition-colors hover:bg-accent',
            showFullLogo ? 'gap-3 px-3' : 'justify-center px-0',
          ].join(' ')}
          aria-label="Toggle logo details"
        >
          {showFullLogo ? (
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),rgba(28,25,23,0.95))] shadow-[0_14px_30px_rgba(16,185,129,0.14)]">
                <img src="./icon.png" alt="" width={"30px"} />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-base font-extrabold uppercase tracking-[0.28em] text-foreground">
                  Tantiya
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-300">
                  Local budget workspace
                </p>
                <p className="muted-copy mt-1 truncate text-xs">
                  Budget tracking with cutoff awareness
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),rgba(28,25,23,0.95))] text-sm font-extrabold uppercase tracking-[0.22em] text-stone-50 shadow-[0_14px_30px_rgba(16,185,129,0.14)]">
              <img src="./icon.png" alt="" width={"50px"} />
            </div>
          )}
        </button>
      </div>

      <nav
        className={[
          'flex-1 min-h-0 p-3',
          mobile ? 'overflow-y-auto overscroll-contain' : 'overflow-visible',
          collapsed ? 'flex flex-col items-center' : '',
        ].join(' ')}
      >
        {showFullLogo && (
          <div className="mb-3 px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Workspace
            </p>
          </div>
        )}

        <div className={['space-y-2', collapsed ? 'w-full max-w-[4.5rem]' : ''].join(' ')}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeId === item.id
          const canShowDetails = expanded || mobile

          return (
            <div key={item.id} className="relative space-y-1">
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                className={[
                  'nav-item-base',
                  isActive ? 'nav-item-active' : 'nav-item-idle',
                  canShowDetails ? '' : 'justify-center gap-0 px-0',
                ].join(' ')}
              >
                <span className={`nav-icon-chip ${isActive ? 'nav-icon-chip-active' : ''}`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>

                {canShowDetails && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span
                      className={[
                        'block truncate text-xs',
                        isActive ? 'text-emerald-100/80' : 'muted-copy',
                      ].join(' ')}
                    >
                      {routeMeta[item.id]?.description ?? item.detail}
                    </span>
                  </span>
                )}
              </button>
            </div>
          )
        })}
        </div>
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <div className={['rounded-2xl border border-border/70 bg-card/60 p-2', collapsed ? 'mx-auto w-fit' : ''].join(' ')}>
          <div className={['flex items-center gap-3', collapsed ? 'justify-center' : ''].join(' ')}>
          {profile.avatarDataUrl ? (
            <img
              src={profile.avatarDataUrl}
              alt={`${profile.fullName} avatar`}
              className="h-10 w-10 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.24),rgba(245,245,244,0.9))] text-xs font-semibold text-foreground dark:bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.22),rgba(41,37,36,0.95))]">
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
      </div>
    </>
  )
}

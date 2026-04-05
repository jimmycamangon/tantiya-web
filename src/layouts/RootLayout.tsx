import { NavLink, Outlet } from 'react-router-dom'

const navigation = [{ to: '/', label: 'Home', end: true }]

export default function RootLayout() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8">
      <header className="sticky top-4 z-20 flex flex-col gap-4 rounded-[28px] border border-black/8 bg-white/75 px-5 py-4 shadow-[0_22px_60px_rgba(75,85,56,0.12)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <NavLink className="text-lg font-extrabold uppercase tracking-[0.24em] text-stone-900" to="/">
          Tantiya
        </NavLink>

        <nav className="flex items-center gap-2" aria-label="Primary">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'rounded-full px-4 py-2 text-sm font-semibold transition duration-200',
                  isActive
                    ? 'bg-stone-900 text-stone-50'
                    : 'text-stone-600 hover:-translate-y-0.5 hover:bg-white/70 hover:text-stone-900',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="pt-6">
        <Outlet />
      </main>
    </div>
  )
}

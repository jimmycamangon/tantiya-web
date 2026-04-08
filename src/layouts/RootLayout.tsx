import { NavLink, Outlet } from 'react-router-dom'
import { Github, Linkedin, Mail } from 'lucide-react'

export default function RootLayout() {
  return (
    <div className="public-shell">
      <header className="public-header">
        <NavLink
          className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card/55 px-3 py-2 transition-colors hover:bg-accent"
          to="/"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),rgba(28,25,23,0.95))] shadow-[0_14px_30px_rgba(16,185,129,0.14)]">
            <img src="./icon.png" alt="" width={"30px"} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold uppercase tracking-[0.28em] text-foreground">
              Tantiya
            </p>
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Local-first budget workspace
            </p>
          </div>
        </NavLink>

        <nav className="flex flex-wrap items-center justify-center gap-3" aria-label="Primary">
          <div className="flex items-center justify-center gap-2 rounded-full border border-border bg-card/55 px-3 py-2">
            <a
              href="https://github.com/jimmycamangon"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/camangon-jimmy-jr-b-b88003294/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="mailto:jimmycamangon121801@gmail.com"
              aria-label="Email"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>

          <span className="inline-flex items-center rounded-full border border-border bg-card/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Version v{__APP_VERSION__}
          </span>
        </nav>
      </header>

      <main className="pt-6">
        <Outlet />
      </main>
    </div>
  )
}

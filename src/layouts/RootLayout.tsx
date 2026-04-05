import { NavLink, Outlet } from 'react-router-dom'
import { Github, Linkedin, Mail } from 'lucide-react'

export default function RootLayout() {
  return (
    <div className="public-shell">
      <header className="public-header">
        <NavLink className="text-lg font-extrabold uppercase tracking-[0.24em] text-foreground" to="/">
          <div className='flex justify-center items-center'><img src="./icon.png" alt="" width={"50px"} />
            &nbsp;TANTIYA</div>

        </NavLink>

        <nav className="flex items-center justify-center gap-2" aria-label="Primary">
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://github.com/jimmycamangon"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="transition hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/camangon-jimmy-jr-b-b88003294/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="transition hover:text-foreground"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="mailto:jimmycamangon121801@gmail.com"
              aria-label="Email"
              className="transition hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
          <span>|</span>
          <span className="transition hover:text-foreground">
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

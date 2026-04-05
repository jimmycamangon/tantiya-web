import { Github, Linkedin, Mail } from 'lucide-react'


const Footer = () => {
  return (
    <footer className="w-full border-t border-border px-6 py-6">
      <div className="mx-auto flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>Free to use</span>
        <span>|</span>
        <span>Local-only data</span>
        <span>|</span>
        <div className="flex items-center gap-3">
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
      </div>
    </footer>
  )
}

export default Footer

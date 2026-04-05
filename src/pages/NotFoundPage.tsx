import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="public-panel mx-auto max-w-3xl p-8">
      <p className="public-eyebrow">
        404
      </p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.06em] text-foreground sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        The route you entered does not exist yet. Head back to the landing page
        and continue building from there.
      </p>
      <Link className="public-primary-button mt-6 px-6" to="/">
        Go home
      </Link>
    </section>
  )
}

import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_70px_rgba(75,85,56,0.12)]">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">
        404
      </p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.06em] text-stone-900 sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
        The route you entered does not exist yet. Head back to the landing page
        and continue building from there.
      </p>
      <Link
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-stone-50 transition duration-200 hover:-translate-y-0.5 hover:bg-stone-800"
        to="/"
      >
        Go home
      </Link>
    </section>
  )
}

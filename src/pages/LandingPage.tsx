
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <section className="grid gap-6 text-foreground lg:grid-cols-[minmax(0,1.25fr)_24rem]">
      <div className="public-panel overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(244,240,224,0.3))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(168,162,158,0.02))]">
        <div className="grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-6 lg:px-10 lg:py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-900/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-emerald-900 dark:border-emerald-300/15 dark:bg-emerald-300/8 dark:text-emerald-300">
              Budget pulse tracker
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-extrabold leading-none tracking-[-0.06em] text-balance text-foreground sm:text-5xl lg:text-7xl">
                Tantiya helps you see what is really left from your money.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Built for real salary cycles, housing payments, and everyday
                gastos. Instead of typing every expense, you tap values fast and
                instantly see your remaining budget.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="public-primary-button px-6" to="/start">
                Open Tantiya
              </Link>
              <Link className="public-outline-button px-6" to="/start">
                Restore or setup
              </Link>
            </div>
          </div>

          <div className="public-dark-panel grid gap-3 p-4">
            <div className="rounded-3xl bg-white/8 p-4 dark:bg-white/6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-200/90">
                Available now
              </p>
              <p className="mt-3 text-4xl font-extrabold tracking-[-0.06em]">
                PHP 12,480
              </p>
              <p className="mt-2 text-sm text-stone-300">
                Real-time remaining budget after bills and tap deductions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ['Income', '22,000'],
                ['Fixed bills', '7,200'],
                ['Tapped gastos', '2,320'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/6 p-4 dark:bg-white/4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-300">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">
                    PHP {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="public-muted-panel flex flex-col gap-4 p-6">
        <div>
          <p className="public-eyebrow">
            Why this works
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
            Designed for quick decisions, not heavy encoding.
          </h2>
        </div>

        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>Track salary, house equity, amortization, and everyday gastos.</p>
          <p>Compare spending per kinsenas or custom cutoff periods.</p>
          <p>Save everything in local storage with export and import backup.</p>
        </div>
      </aside>

      <div
        id="highlights"
        className="grid gap-4 md:grid-cols-3 lg:col-span-2"
      >
        {[
          {
            title: 'Tap-based spending',
            body: 'Deduct from your budget through quick amounts and number choices instead of long manual input.',
          },
          {
            title: 'Custom cutoff tracking',
            body: 'Define coverage dates, expected salary, and actual payout so the budget follows your real payroll cycle.',
          },
          {
            title: 'Backup without a database',
            body: 'Keep the app offline-friendly with localStorage plus export and import for safe backups.',
          },
        ].map((item) => (
          <article
            key={item.title}
            className="public-muted-panel rounded-[1.75rem] p-6"
          >
            <p className="public-eyebrow">
              Core feature
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.body}
            </p>
          </article>
        ))}
      </div>

      <div
        id="flow"
        className="public-panel grid gap-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.35),rgba(244,240,224,0.2))] p-6 lg:col-span-2 md:grid-cols-4 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(168,162,158,0.02))]"
      >
        {[
          ['1', 'Set income', 'Add salary, budget cycle, and housing obligations.'],
          ['2', 'Choose a cutoff', 'Track by month, kinsenas, or a custom declared range.'],
          ['3', 'Tap your gastos', 'Use quick values instead of typing every single expense.'],
          ['4', 'Read the signal', 'See remaining budget and compare if one cutoff is more magastos.'],
        ].map(([step, title, body]) => (
          <div key={step} className="public-dark-panel rounded-[1.5rem] px-5 py-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-200">
              Step {step}
            </p>
            <h2 className="mt-3 text-xl font-bold tracking-[-0.04em]">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

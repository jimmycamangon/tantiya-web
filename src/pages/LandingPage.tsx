
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <section className="space-y-6 text-foreground">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_24rem]">
        <div className="public-panel overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(244,240,224,0.22),rgba(16,185,129,0.08))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(168,162,158,0.02),rgba(16,185,129,0.05))]">
          <div className="grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-8 lg:px-10 lg:py-12">
            <div className="space-y-7">
              <div className="flex flex-wrap items-center gap-3">
                <div className="emerald-copy inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-900/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] dark:border-emerald-300/15 dark:bg-emerald-300/8">
                  Budget pulse tracker
                </div>
                <div className="inline-flex items-center rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Local-first and private
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-extrabold leading-none tracking-[-0.065em] text-balance text-foreground sm:text-5xl lg:text-7xl">
                  Know what your money can still do before the next cutoff arrives.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Tantiya is built for real salary timing, housing obligations, recurring bills,
                  and everyday gastos. Tap fast, charge spending to the right cutoff, and see your
                  true remaining budget without heavy encoding.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className="public-primary-button px-6" to="/start">
                  Open Tantiya
                </Link>
                <Link className="public-outline-button px-6" to="/start">
                  Import or continue
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Track by cutoff', 'Built for kinsenas, payroll cycles, and delayed payouts.'],
                  ['Tap to deduct', 'Use quick amount presets instead of typing every expense.'],
                  ['No database needed', 'Keep everything in local storage with JSON backup.'],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-border bg-card/55 px-4 py-4">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="public-dark-panel grid gap-3 p-4">
              <div className="rounded-[1.75rem] bg-white/8 p-4 dark:bg-white/6">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-200/90">
                  Live pulse
                </p>
                <p className="mt-3 text-4xl font-extrabold tracking-[-0.06em]">
                  PHP 12,480
                </p>
                <p className="mt-2 text-sm text-stone-300">
                  Remaining budget after bills, housing, and quick deduct taps.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-4 dark:bg-white/4">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-300">Charged cutoff</p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">Second cutoff</p>
                <p className="mt-2 text-sm text-stone-300">Mar 16 - Mar 31 salary still powering your current spending.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  ['Income', '22,000'],
                  ['Committed costs', '7,200'],
                  ['Tapped gastos', '2,320'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 dark:bg-white/4"
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

        <aside className="public-muted-panel flex flex-col gap-5 p-6">
          <div>
            <p className="public-eyebrow">
              Why this works
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
              Designed for daily budget awareness, not spreadsheet fatigue.
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>Track salary, house equity, amortization, payroll deductions, and everyday gastos.</p>
            <p>Compare how you spend every cutoff so you can spot if one cycle is more magastos.</p>
            <p>Restore your data anytime through JSON import and keep everything local-first.</p>
          </div>

          <div className="grid gap-3">
            {[
              ['Best for', 'People budgeting by salary release or kinsenas'],
              ['Storage', 'Local storage with export and import backup'],
              ['Main habit', 'Open app, tap amount, see what is left'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-card/55 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                <p className="mt-2 font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div
        id="highlights"
        className="grid gap-4 md:grid-cols-3"
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
        className="public-panel grid gap-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.35),rgba(244,240,224,0.2))] p-6 md:grid-cols-4 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(168,162,158,0.02))]"
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

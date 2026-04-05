
export default function LandingPage() {
  return (
    <section className="grid gap-6 text-stone-900 lg:grid-cols-[minmax(0,1.25fr)_24rem]">
      <div className="overflow-hidden rounded-[2rem] border border-black/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(244,240,224,0.92))] shadow-[0_26px_80px_rgba(75,85,56,0.14)]">
        <div className="grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-6 lg:px-10 lg:py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-900/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-emerald-900">
              Budget pulse tracker
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-extrabold leading-none tracking-[-0.06em] text-balance sm:text-5xl lg:text-7xl">
                Tantiya helps you see what is really left from your money.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-700 sm:text-lg">
                Built for real salary cycles, housing payments, and everyday
                gastos. Instead of typing every expense, you tap values fast and
                instantly see your remaining budget.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-stone-50 transition duration-200 hover:-translate-y-0.5 hover:bg-stone-800"
                href="#highlights"
              >
                Explore highlights
              </a>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-900/10 bg-white/70 px-6 text-sm font-semibold text-stone-800 transition duration-200 hover:-translate-y-0.5 hover:bg-white"
                href="#flow"
              >
                See the flow
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-[1.75rem] bg-stone-900 p-4 text-stone-50 shadow-inner shadow-black/20">
            <div className="rounded-3xl bg-white/8 p-4">
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
                  className="rounded-3xl border border-white/10 bg-white/6 p-4"
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

      <aside className="flex flex-col gap-4 rounded-[2rem] border border-black/8 bg-white/75 p-6 shadow-[0_20px_60px_rgba(75,85,56,0.12)] backdrop-blur">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700">
            Why this works
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-stone-900">
            Designed for quick decisions, not heavy encoding.
          </h2>
        </div>

        <div className="space-y-3 text-sm leading-6 text-stone-700">
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
            className="rounded-[1.75rem] border border-black/8 bg-white/75 p-6 shadow-[0_18px_40px_rgba(75,85,56,0.08)]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
              Core feature
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-stone-900">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              {item.body}
            </p>
          </article>
        ))}
      </div>

      <div
        id="flow"
        className="grid gap-4 rounded-[2rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(244,240,224,0.92))] p-6 shadow-[0_22px_60px_rgba(75,85,56,0.12)] lg:col-span-2 md:grid-cols-4"
      >
        {[
          ['1', 'Set income', 'Add salary, budget cycle, and housing obligations.'],
          ['2', 'Choose a cutoff', 'Track by month, kinsenas, or a custom declared range.'],
          ['3', 'Tap your gastos', 'Use quick values instead of typing every single expense.'],
          ['4', 'Read the signal', 'See remaining budget and compare if one cutoff is more magastos.'],
        ].map(([step, title, body]) => (
          <div key={step} className="rounded-[1.5rem] bg-stone-900 px-5 py-6 text-stone-50">
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

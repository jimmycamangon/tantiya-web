import { Link } from 'react-router-dom'

const beginnerSteps = [
  {
    step: 'Step 1',
    title: 'Open Budget Setup first',
    body: 'Choose whether you budget by whole month or by payroll cutoff, then enter your planned income, bills, deductions, housing, and quick deduct presets.',
    path: '/setup',
    cta: 'Open setup',
  },
  {
    step: 'Step 2',
    title: 'Check your Dashboard',
    body: 'After setup, the dashboard becomes your main home. It shows your live remaining budget, current cutoff, reminders, and your important totals.',
    path: '/dashboard',
    cta: 'Open dashboard',
  },
  {
    step: 'Step 3',
    title: 'Log actual salary in Income',
    body: 'Use the Income page when your salary or allowance is really received. Tantiya will use those real amounts instead of relying only on expected setup values.',
    path: '/income',
    cta: 'Open income',
  },
  {
    step: 'Step 4',
    title: 'Use Quick Deduct for daily gastos',
    body: 'When you spend money on food, fare, load, shopping, or other categories, log it in Quick Deduct so your remaining budget updates right away.',
    path: '/quick-deduct',
    cta: 'Open quick deduct',
  },
  {
    step: 'Step 5',
    title: 'Review cutoff totals when salary is split',
    body: 'If you budget by cutoff, use the Cutoffs page to compare periods and manually add carryover when leftover wallet money should move into the new cutoff.',
    path: '/cutoffs',
    cta: 'Open cutoffs',
  },
  {
    step: 'Step 6',
    title: 'Use Analysis and History to clean up',
    body: 'Analysis helps you see spending trends, while History helps you review or correct saved expense entries when something looks off.',
    path: '/analysis',
    cta: 'Open analysis',
  },
]

const pageGuide = [
  {
    title: 'Budget Setup',
    body: 'Use this whenever your salary, bills, deductions, cutoffs, or housing details change.',
  },
  {
    title: 'Dashboard',
    body: 'Use this daily if you want the quickest view of your current budget health.',
  },
  {
    title: 'Income',
    body: 'Use this only for money that already came in, not for expected future salary.',
  },
  {
    title: 'Quick Deduct',
    body: 'Use this for fast daily expense logging when you buy something.',
  },
  {
    title: 'Cutoffs',
    body: 'Use this if your budget follows first cutoff and second cutoff style tracking.',
  },
  {
    title: 'History',
    body: 'Use this when you need to review, edit, or confirm what was already logged.',
  },
]

const beginnerTips = [
  'Start with setup before logging any income or expenses.',
  'Only enter actual salary in Income once you really receive it.',
  'Use Quick Deduct often so the dashboard stays accurate.',
  'If you still have wallet money from the last cutoff, add it as carryover on the Cutoffs page.',
  'Review Analysis once you already have enough expense entries to compare patterns.',
]

export default function GettingStartedPage() {
  return (
    <section className="space-y-6">
      <section className="surface-card rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,251,240,0.82),rgba(242,236,220,0.48))] p-6 shadow-[0_18px_48px_rgba(75,85,56,0.08)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700 dark:text-amber-300">
          Getting started
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">
          A simple guide for first-time Tantiya users.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          If this is your first time inside Tantiya, use this page as your walkthrough. The goal is
          simple: set your budget structure first, log real money in and out, then use the dashboard
          as your daily budget view.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/setup" className="public-primary-button px-5">
            Start with setup
          </Link>
          <Link to="/dashboard" className="public-outline-button px-5">
            Open dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="surface-card rounded-[1.75rem] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Step by step
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Follow this order if you want the smoothest first-time experience.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {beginnerSteps.map((item) => (
              <article key={item.title} className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {item.step}
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                <div className="mt-4">
                  <Link to={item.path} className="public-outline-button px-4">
                    {item.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="surface-card rounded-[1.75rem] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Best habit
            </p>
            <p className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">
              Setup once, update daily.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Most users only need to revisit setup when their income plan, recurring bills, or
              cutoff rules change. Day to day, they mostly use Dashboard, Income, and Quick Deduct.
            </p>
          </section>

          <section className="surface-card rounded-[1.75rem] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Beginner tips
            </p>
            <div className="mt-4 space-y-3">
              {beginnerTips.map((tip) => (
                <div key={tip} className="rounded-2xl bg-muted/50 px-4 py-4 text-sm leading-6 text-muted-foreground">
                  {tip}
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="surface-card rounded-[1.75rem] p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
            What each page is for
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This helps new users know where to go instead of guessing.
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pageGuide.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl bg-[linear-gradient(180deg,rgba(255,252,246,0.78),rgba(244,239,226,0.42))] px-4 py-4 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]"
            >
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

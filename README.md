# Tantiya

Tantiya is a local-first budget tracker built for real salary cycles, custom cutoffs, recurring bills, housing payments, and quick daily gastos.

Instead of typing every expense, you can tap preset amounts and instantly see what is left in your budget.

## What Tantiya Does

- Track budget by month or by cutoff
- Log expected income and actual received income
- Deduct gastos quickly with tap amounts
- Compare spending across cutoffs
- Track recurring bills and due days
- Save everything in local storage
- Export and import backup data as JSON

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS

## Run Locally

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Notes

- Tantiya currently uses `localStorage`, not a database.
- Your budget data stays in the browser unless you export it.
- Import/export is available for backup and restore.

## License

MIT

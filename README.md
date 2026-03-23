# ClearPath - Healthcare Cost Intelligence

ClearPath is a Next.js app for insurance guidance, medical document parsing, cost estimation, and financial planning workflows.

## Quick Start

```bash
npm install --legacy-peer-deps
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite database path |
| `OPENAI_API_KEY` | API key for the assistant flow |
| `PLAID_CLIENT_ID` | Plaid sandbox client ID |
| `PLAID_SECRET` | Plaid sandbox secret |
| `PLAID_ENV` | Should be `sandbox` |

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push the Prisma schema to SQLite |
| `npm run db:seed` | Seed mock application data |
| `npm run seed:plaid` | Seed Plaid sandbox personas |
| `npm run db:studio` | Open Prisma Studio |

## Project Layout

```text
src/                  application routes, components, libraries, and types
prisma/               Prisma schema and seed scripts
dummy_data/           sample CSVs and reference PDFs for manual checks
docs/                 process notes, guides, and integration docs
scripts/db/           ad hoc database maintenance helpers
tests/manual/         manual API and document parsing harnesses
```

## Manual Utilities

- Database helper scripts live in `scripts/db/`.
- Manual API and parsing checks live in `tests/manual/`.
- Utility script outputs are written to ignored folders under `scripts/output/` and `tests/output/`.

## Plaid Sandbox

Use [http://localhost:3000/dev/plaid](http://localhost:3000/dev/plaid) to:

1. Link a sandbox account or create a mock item.
2. Inject sandbox transactions.
3. Run `/api/plaid/sync`.
4. Inspect generated AI financial context.

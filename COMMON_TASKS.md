# Common Tasks (Do Together First)

> One person does this, pushes to `main`, the other pulls. ~15 min.

## Setup

- [x] Install deps: `npm i prisma @prisma/client @google/generative-ai`
- [x] Create `prisma/schema.prisma` with all data models:
  - User, InsurancePlan, ConnectedAccount, Document, Conversation, Message, CareReminder, Activity, CostEstimate, Scenario, Insight, Alert
- [x] Create `.env.example`:
  ```
  DATABASE_URL="file:./dev.db"
  OPENAI_API_KEY="your-openai-api-key-here"
  ```
- [x] Create `.env` locally (copy from `.env.example`, add real keys)
- [x] Run `npx prisma db push` to create SQLite database
- [x] Create `prisma/seed.ts` — seed DB with current mock data
- [x] Run `npx prisma db seed` and verify with `npx prisma studio`

## Shared Library Files

- [x] Create `src/lib/db.ts` — Prisma client singleton
- [x] Create `src/lib/gemini.ts` — Gemini AI client + healthcare system prompt
- [x] Create `src/lib/pricing.ts` — reference pricing data for cost estimator

## Config Updates

- [x] Update `.gitignore` — add `.env`, `prisma/dev.db`, `uploads/`
- [x] Update `package.json` — add scripts: `db:push`, `db:seed`, `db:studio`

## After Both Branches Merge

- [x] Run `npm run build` — fix any TypeScript errors
- [x] End-to-end smoke test every page
- [x] Update `README.md` with new setup instructions (env vars, DB setup)

# Common Tasks (Do Together First)

> One person does this, pushes to `main`, the other pulls. ~15 min.

## Setup

- [ ] Install deps: `npm i prisma @prisma/client @google/generative-ai`
- [ ] Create `prisma/schema.prisma` with all data models:
  - User, InsurancePlan, ConnectedAccount, Document, Conversation, Message, CareReminder, Activity, CostEstimate, Scenario, Insight, Alert
- [ ] Create `.env.example`:
  ```
  DATABASE_URL="file:./dev.db"
  GEMINI_API_KEY="your-gemini-api-key-here"
  ```
- [ ] Create `.env` locally (copy from `.env.example`, add real keys)
- [ ] Run `npx prisma db push` to create SQLite database
- [ ] Create `prisma/seed.ts` — seed DB with current mock data
- [ ] Run `npx prisma db seed` and verify with `npx prisma studio`

## Shared Library Files

- [ ] Create `src/lib/db.ts` — Prisma client singleton
- [ ] Create `src/lib/gemini.ts` — Gemini AI client + healthcare system prompt
- [ ] Create `src/lib/pricing.ts` — reference pricing data for cost estimator

## Config Updates

- [ ] Update `.gitignore` — add `.env`, `prisma/dev.db`, `uploads/`
- [ ] Update `package.json` — add scripts: `db:push`, `db:seed`, `db:studio`

## After Both Branches Merge

- [ ] Run `npm run build` — fix any TypeScript errors
- [ ] End-to-end smoke test every page
- [ ] Update `README.md` with new setup instructions (env vars, DB setup)

# ClearPath

ClearPath is an AI-powered medical financial assistant built to help a user understand insurance coverage, ingest healthcare documents, reconcile bills against EOBs, estimate care costs, and choose realistic payment strategies based on their financial situation.

It combines document extraction, structured healthcare data, financial context, and LLM responses into a single workflow-oriented web app.

## What the App Does

- Uploads insurance plans, medical bills, and EOBs.
- Classifies and extracts structured data from uploaded documents.
- Normalizes bills and EOBs into relational database models.
- Reconciles bills to matching EOBs when possible.
- Builds a medical-financial context packet for the assistant.
- Generates AI guidance for bill review, payment planning, negotiation, hardship, and appeal scenarios.
- Estimates care costs across settings like telehealth, primary care, urgent care, and hospital care.
- Models larger treatment scenarios and payment-plan tradeoffs.
- Supports Plaid sandbox flows for financial-account and transaction context.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Prisma ORM
- SQLite for local development
- OpenAI API for document analysis, assistant responses, and scenario generation
- Plaid sandbox integration for financial-account context
- Tailwind CSS v4
- Framer Motion
- Radix UI primitives
- Lucide React icons

## Architecture Overview

ClearPath is a full-stack Next.js application with the UI and server routes in the same codebase.

- `src/app/*` contains route segments for the product surfaces:
  dashboard, assistant, insurance, documents, cost estimator, scenarios, settings, and a Plaid dev panel.
- `src/app/api/*` contains the server routes that power document ingestion, dashboard aggregation, assistant chat, Plaid sync, settings, and supporting workflows.
- `src/lib/ai/*` contains context building, intent classification, prompt construction, document normalization sync, and deterministic medical-debt strategy scoring.
- `src/lib/gemini.ts` is the current AI integration layer despite the filename; it uses the OpenAI SDK and `gpt-4o-mini`.
- `src/lib/plaid/*` handles Plaid client setup, account sync, transaction normalization, and affordability analytics.
- `prisma/schema.prisma` defines the core domain models:
  users, conversations, documents, insurance plans, medical bills, EOBs, reconciliation links, Plaid entities, financial profile snapshots, and strategy snapshots.

## Core Data Flow

1. A document is uploaded through `/documents`.
2. `src/app/api/documents/route.ts` stores the file in `uploads/`, extracts text, and sends the content to the AI analyzer.
3. The analyzer classifies the file as an insurance plan, medical bill, or EOB and returns structured data.
4. `src/lib/ai/document-sync.ts` projects that structured data into normalized Prisma models such as `MedicalBill`, `ExplanationOfBenefits`, and `InsurancePlanDocumentSummary`.
5. Bills and EOBs are linked manually or matched heuristically.
6. When the assistant is called, `src/lib/ai/context/build-context-packet.ts` assembles insurance, financial, document, and conversation context.
7. The LLM returns structured guidance that the assistant UI renders as actionable next steps and strategy options.

## Main Product Areas

- Dashboard: insurance progress, reminders, recent activity, and shortcuts into core workflows.
- Documents: upload, classify, inspect, link, archive, and delete insurance plans, bills, and EOBs.
- AI Assistant: asks bill-specific or general medical-cost questions with structured medical-financial reasoning.
- Insurance: shows deductible, out-of-pocket progress, copays, pharmacy benefits, exclusions, and prior auth rules.
- Cost Estimator: compares likely costs across care settings.
- Scenario Planner: models major procedures, HSA usage, and payment-plan options.
- Plaid Dev Panel: sandbox-only tooling for linking accounts, syncing transactions, and generating AI context.

## Getting Started After Forking

### Prerequisites

- Node.js 20+
- npm

### 1. Clone and install

```bash
git clone <your-fork-url>
cd vandyHacks
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is useful here because the repo uses a modern Next.js and React stack alongside several UI dependencies.

### 2. Create environment variables

Start from the example file:

```bash
cp .env.example .env
```

Then set the following values in `.env`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Prisma SQLite connection string. Default local value is `file:./dev.db`. |
| `OPENAI_API_KEY` | Yes | Required for document analysis, assistant responses, and scenario generation. |
| `PLAID_CLIENT_ID` | Optional | Required only if you want Plaid sandbox features. |
| `PLAID_SECRET` | Optional | Required only if you want Plaid sandbox features. |
| `PLAID_ENV` | Optional | Usually `sandbox` for local development. |

Note: `.env.example` currently includes the minimum local variables. If you want Plaid features, add the Plaid variables manually.

### 3. Initialize the database

```bash
npm run db:push
npm run db:seed
```

This creates the SQLite database and seeds a sample user, insurance plan, reminders, conversations, scenarios, and sample documents.

### 4. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Optional Plaid Sandbox Setup

If you want to use the Plaid flows:

1. Add `PLAID_CLIENT_ID`, `PLAID_SECRET`, and `PLAID_ENV=sandbox` to `.env`.
2. Start the app.
3. Open `http://localhost:3000/dev/plaid`.
4. Create or link a sandbox item.
5. Run transaction sync and generate AI context JSON.

The repository also includes:

- `npm run seed:plaid` for seeded financial personas
- Plaid sync routes under `src/app/api/plaid/*`
- sandbox helpers under `src/app/api/sandbox/*`

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run db:push
npm run db:seed
npm run db:studio
npm run seed:plaid
```

## Project Structure

```text
src/
  app/                Next.js pages and API routes
  components/         layout, shared UI, and Plaid components
  lib/                AI, Plaid, utilities, and mock data
  types/              shared TypeScript types
prisma/               schema and seed scripts
dummy_data/           sample CSVs and reference PDFs
docs/                 design, process, and integration notes
scripts/db/           ad hoc database helper scripts
tests/manual/         manual API and parsing harnesses
uploads/              runtime-uploaded files in local development
```

## Development Notes

- Local persistence is SQLite through Prisma.
- Uploaded files are written to `uploads/` in development.
- The app uses seeded and derived data together; some views read live Prisma records while others use helper logic and mock configuration.
- There is no formal automated test suite in the repository right now. The main verification command is `npm run build`, and there are manual utilities under `tests/manual/`.



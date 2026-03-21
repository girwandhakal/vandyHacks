# ClearPath — Healthcare Cost Intelligence

A premium healthcare cost and insurance guidance app built for VandyHacks. Helps users understand insurance coverage, estimate medical costs, model major events, and make informed healthcare decisions through an AI-driven interface.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 15** — App Router, TypeScript
- **Tailwind CSS v4** — Two-tone ivory/charcoal design system
- **Framer Motion** — Subtle entrance animations
- **Lucide React** — Icon system
- **Recharts** — Available for charts (not yet used)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard / Home
│   ├── assistant/          # AI Assistant conversational UI
│   ├── insurance/          # Insurance plan overview
│   ├── documents/          # Document uploads & management
│   ├── cost-estimator/     # Care cost comparison tool
│   ├── scenarios/          # Major event financial planner
│   ├── insights/           # Proactive recommendations
│   └── settings/           # Account & preferences
├── components/
│   ├── layout/             # Sidebar, layout components
│   └── shared/             # Reusable UI components
├── lib/
│   ├── mock/               # All mock data (8 files)
│   └── utils.ts            # Utility functions (cn, formatCurrency, etc.)
└── types/
    └── index.ts            # TypeScript interfaces for all entities
```

## Design System

- **Palette**: Warm ivory `#FAF9F6` / deep charcoal `#1C1C1E` / accent blue `#2563EB`
- **Typography**: Inter (sans), JetBrains Mono (mono)
- **Components**: Card-based layouts, progress rings, status badges, stat cards
- **Motion**: Framer Motion entrance animations (fade + translate)

## Mock Data

All located in `src/lib/mock/`:

| File | Contents |
|------|----------|
| `insurance.ts` | Full plan details (BCBS PPO Gold) |
| `dashboard.ts` | Alerts, quick actions, reminders, financial snapshot |
| `assistant.ts` | Sample AI conversation with structured responses |
| `documents.ts` | Uploaded documents in various states |
| `cost-estimator.ts` | Care option comparison data |
| `scenarios.ts` | Major event payment scenarios |
| `insights.ts` | Prioritized recommendations |
| `user.ts` | User profile and connected accounts |

## Future Backend Integration Points

| Feature | Integration |
|---------|-------------|
| Insurance parsing | Replace mock plan data with document parsing API |
| Claims tracking | Connect to claims/deductible tracking service |
| Cost estimation | Plug into cost estimation engine |
| AI Assistant | Connect to conversational AI API |
| Documents | Add file upload to cloud storage + parsing pipeline |
| Financial data | Integration with bank/HSA/FSA aggregation APIs |
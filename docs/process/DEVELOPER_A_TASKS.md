# Developer A — API Routes & Backend Logic

> **Branch:** `backend/api-routes`
> **Scope:** All new files inside `src/app/api/` — no existing files modified.

## Prerequisites
- [ ] Pull latest `main` (after common setup is pushed)
- [ ] Create branch: `git checkout -b backend/api-routes`

---

## Settings API — `src/app/api/settings/`
- [ ] `GET /api/settings` — return user profile + connected accounts + preferences
- [ ] `PUT /api/settings/preferences` — toggle notification/email/dark mode prefs
- [ ] `PUT /api/settings/profile` — update name/email

## Insurance API — `src/app/api/insurance/`
- [ ] `GET /api/insurance` — return full insurance plan from DB
- [ ] `PUT /api/insurance` — update plan details

## Reminders API — `src/app/api/reminders/`
- [ ] `GET /api/reminders` — list care reminders
- [ ] `POST /api/reminders` — create a new reminder
- [ ] `PATCH /api/reminders` — update reminder status (upcoming/completed/overdue)

## Dashboard API — `src/app/api/dashboard/`
- [ ] `GET /api/dashboard` — aggregated response with:
  - User greeting (name + current month)
  - Alerts from DB
  - Insurance plan deductible & OOP progress (compute percentages)
  - Financial snapshot (sum spending records, compute YTD, pull HSA balance)
  - Upcoming care reminders
  - Recent activity feed

## AI Assistant API — `src/app/api/assistant/`
- [ ] `POST /api/assistant` — accept `{ message, conversationId? }`:
  - Load user's insurance plan for context
  - Build system prompt with plan details (deductible, copays, coinsurance)
  - Call Gemini API
  - Parse response into `StructuredResponse` JSON (recommendation, cost range, coverage, confidence, follow-ups)
  - Save message + response to DB
  - Return response
- [ ] `GET /api/assistant/conversations` — list past conversations
- [ ] Handle Gemini JSON parsing edge cases (markdown-wrapped JSON, plain text fallback)

## Documents API — `src/app/api/documents/`
- [ ] `POST /api/documents` — multipart form upload:
  - Save file to `uploads/` directory
  - Create DB record with status `analyzing`
  - Call Gemini to extract plan info (plan name, deductible, OOP max, coverage)
  - Update record with extracted data, set status to `ready` or `error`
- [ ] `GET /api/documents` — list all uploaded documents
- [ ] `GET /api/documents/[id]` — single document details

## Cost Estimator API — `src/app/api/cost-estimator/`
- [ ] `POST /api/cost-estimator` — accept `{ visitType, inNetwork }`:
  - Look up base costs from reference pricing data
  - Apply user's deductible progress (remaining amount)
  - Apply copay (if applicable) or coinsurance rate
  - Apply in-network vs out-of-network rates
  - Cap at remaining OOP max
  - Return array of `CareCompareOption` for each care setting

## Scenarios API — `src/app/api/scenarios/`
- [ ] `POST /api/scenarios` — accept `{ procedureType }`:
  - Look up procedure base cost
  - Compute insurance portion (apply deductible, coinsurance, OOP max)
  - Compute user responsibility
  - HSA strategy: recommend min(hsaBalance, responsibility × 60%)
  - Financial strain: responsibility / monthly income → low/moderate/high
  - Generate 4 payment plans (HSA+plan, plan only, financing, pay in full)
- [ ] `GET /api/scenarios` — list saved scenarios

## Insights API — `src/app/api/insights/`
- [ ] `GET /api/insights` — run rule engine:
  - Check deductible progress → timing insight
  - Check HSA balance → optimization insight
  - Check OOP progress → spending warning
  - Check overdue reminders → action items
  - Check spending trends → savings opportunities
  - Return prioritized insight array

---

## When Done
- [ ] Test each endpoint manually (curl or browser)
- [ ] Push branch, create PR to `main`

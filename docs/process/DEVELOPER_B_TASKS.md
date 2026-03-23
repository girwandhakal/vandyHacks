# Developer B — Frontend Wiring & UI Updates

> **Branch:** `frontend/wire-pages`
> **Scope:** Modify existing page files to call APIs. No files in `src/app/api/` touched.

## Prerequisites
- [ ] Pull latest `main` (after common setup is pushed)
- [ ] Create branch: `git checkout -b frontend/wire-pages`

---

## Shared Component
- [ ] Create `src/components/shared/skeleton.tsx` — loading skeleton component for all pages

## Wire Dashboard — `src/app/page.tsx`
- [ ] Replace mock imports with `fetch('/api/dashboard')` using `useEffect` + `useState`
- [ ] Add loading skeleton while data fetches
- [ ] Handle error states
- [ ] User greeting uses real name from API response

## Wire AI Assistant — `src/app/assistant/page.tsx`
- [ ] Replace `mockConversation` with real state (`useState` for messages array)
- [ ] On send button click: `POST /api/assistant` with `{ message }`, append response
- [ ] On suggested question click: send that question
- [ ] On follow-up chip click: send that follow-up
- [ ] Show typing indicator while waiting for AI response
- [ ] Handle error state (API failure)

## Wire Insurance — `src/app/insurance/page.tsx`
- [ ] Replace `mockInsurancePlan` with `fetch('/api/insurance')`
- [ ] Add loading state

## Wire Documents — `src/app/documents/page.tsx`
- [ ] Replace `mockDocuments` with `fetch('/api/documents')`
- [ ] Wire upload zone: on file drop → `POST /api/documents` (FormData)
- [ ] Show upload progress
- [ ] Poll or refresh to show status changes (analyzing → ready)
- [ ] Add loading state

## Wire Cost Estimator — `src/app/cost-estimator/page.tsx`
- [ ] Replace `mockCareOptions` with dynamic fetch
- [ ] On visit type or network change: `POST /api/cost-estimator` with `{ visitType, inNetwork }`
- [ ] Update care option cards with API response
- [ ] Add loading state during computation

## Wire Scenarios — `src/app/scenarios/page.tsx`
- [ ] Replace `mockScenario` with dynamic fetch
- [ ] On procedure selection: `POST /api/scenarios` with `{ procedureType }`
- [ ] Update all breakdown cards with API response
- [ ] Add loading state

## Wire Insights — `src/app/insights/page.tsx`
- [ ] Replace `mockInsights` with `fetch('/api/insights')`
- [ ] Add loading state

## Wire Settings — `src/app/settings/page.tsx`
- [ ] Replace `mockUser` with `fetch('/api/settings')`
- [ ] Wire preference toggles: on toggle → `PUT /api/settings/preferences`
- [ ] Show optimistic UI (toggle immediately, revert on error)
- [ ] Add loading state

---

## Tips
- You can start coding `fetch()` calls and state management **immediately** — use the existing mock data types as the expected API response shape
- If Person A's APIs aren't ready yet, temporarily fall back to mock data:
  ```ts
  const data = await fetch('/api/dashboard')
    .then(r => r.json())
    .catch(() => mockDashboardData); // fallback
  ```

## When Done
- [ ] Pull Person A's merged branch into yours
- [ ] Test all pages against real APIs
- [ ] Push branch, create PR to `main`

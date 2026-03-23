You are implementing Plaid Sandbox integration inside a Next.js full-stack app.

Goal:
Build a production-structured Plaid Sandbox integration using fake data only, with backend storage and detailed transaction analytics that will later be used as AI context for a financial + insurance assistant.

Core requirements:
- Use Plaid Sandbox, not Development or Production.
- Support Plaid Link in sandbox mode.
- Support custom fake transaction data that we define ourselves.
- Store financial data securely in the backend.
- Build analytics on top of transactions so the AI assistant can reason about:
  - income
  - expenses
  - rent or mortgage
  - recurring subscriptions
  - debt payments
  - discretionary / wasteful spending
  - cash flow stability
  - medical bill affordability
  - whether the user can pay now, use installments, consider a loan, negotiate the bill, or seek charity care
- The AI will also later combine this with:
  - insurance plan data
  - deductible status
  - out-of-pocket max status
  - other healthcare cost context

Important Plaid constraints to respect:
- Plaid Sandbox supports custom test users with custom accounts, balances, and transaction lists.
- Plaid Sandbox also supports dynamic transaction injection through /sandbox/transactions/create, but only for Items created with the user_transactions_dynamic test user, and only up to 10 transactions at a time.
- For large predefined fake histories, use custom Sandbox user configuration.
- For simulating new transactions arriving later, use /sandbox/transactions/create.
- Use /transactions/sync for transaction ingestion and incremental updates, not legacy polling as the main strategy.


Deliverables:
1. Implement Plaid backend integration
2. Implement sandbox link flow
3. Implement fake data seeding flow
4. Implement transaction sync flow
5. Implement backend schema
6. Implement financial analytics engine
7. Implement AI context builder
8. Add docs and sample test data
9. Add a small admin/test page to trigger sandbox flows for development

Make sure the implementation is testable and integrates well with the existing codebase. The organization should be kept clean.

Implementation details:

1. Environment setup
- Add required environment variables:
  - PLAID_CLIENT_ID
  - PLAID_SECRET
  - PLAID_ENV=sandbox
  - PLAID_PRODUCTS=transactions
  - PLAID_COUNTRY_CODES=US
  - PLAID_REDIRECT_URI if needed
- Keep all Plaid secrets server-side only.
- Never expose access_token to the client.
- Add a Plaid server client utility module.

2. Plaid server client
Create a reusable Plaid client module configured for sandbox.
Expose typed helper functions for:
- createLinkToken(userId)
- exchangePublicToken(publicToken)
- getAccounts(accessToken)
- syncTransactions(accessToken, cursor?)
- createSandboxPublicToken(...)
- createSandboxTransactions(...)
- optional fireSandboxWebhook helpers if useful

3. Link flow
Implement the full sandbox Link flow:
- API route to create link_token
- frontend component/page to launch Plaid Link
- callback handling of public_token
- backend route to exchange public_token for access_token
- store Item metadata securely in DB

4. Sandbox fake data strategy
Implement both of these paths:

A. Custom fake Item creation
- Create a dev-only backend endpoint that can create a Plaid Sandbox Item using /sandbox/public_token/create
- Support passing:
  - institution_id
  - initial_products
  - override_username
  - override_password
  - optional transaction date window
- Add support for custom user configuration so we can define:
  - account type/subtype
  - account name
  - starting balance
  - custom transactions
  - recurring payroll / inflow model if useful

B. Dynamic transaction creation
- Create a dev-only endpoint for /sandbox/transactions/create
- Restrict it to sandbox only
- Make it work with Items created from user_transactions_dynamic
- Accept a list of new transactions to inject:
  - amount
  - date_posted
  - description
  - iso_currency_code
- Use this to simulate future spending or medical bills during testing

5. Database schema
Design schema for:
- User
- PlaidItem
- PlaidAccount
- PlaidTransactionRaw
- PlaidTransactionNormalized
- FinancialProfileSnapshot
- InsurancePlan
- InsuranceAccumulatorStatus
- AIContextSnapshot

Suggested field ideas, but make sure to implement so that it fits well with the existing codebase such that what we have right now does not break:

PlaidItem:
- id
- userId
- plaidItemId
- accessTokenEncrypted
- institutionId
- institutionName
- cursor
- status
- lastSyncedAt

PlaidAccount:
- id
- userId
- plaidItemId
- plaidAccountId
- name
- officialName
- type
- subtype
- currentBalance
- availableBalance
- mask
- isoCurrencyCode

PlaidTransactionRaw:
- id
- userId
- plaidItemId
- plaidTransactionId
- plaidAccountId
- amount
- dateAuthorized
- datePosted
- name
- merchantName
- pending
- categoryJson
- paymentChannel
- originalJson
- syncedAt

PlaidTransactionNormalized:
- id
- userId
- rawTransactionId
- normalizedCategory
- cashflowDirection
- essentialityScore
- recurringCandidate
- merchantCanonical
- confidence
- tagsJson

FinancialProfileSnapshot:
- id
- userId
- asOfDate
- monthlyIncomeEstimate
- monthlyFixedCosts
- monthlyVariableCosts
- monthlyMedicalSpend
- monthlyDebtPayments
- monthlySubscriptions
- savingsRate
- freeCashFlow
- emergencyBufferMonths
- housingStatus
- housingPaymentEstimate
- affordabilityRiskLevel
- insightsJson

InsurancePlan:
- id
- userId
- payerName
- planName
- deductibleIndividual
- oopMaxIndividual
- coinsuranceRuleJson
- copayRuleJson
- rawPlanJson

InsuranceAccumulatorStatus:
- id
- userId
- asOfDate
- deductibleMet
- oopMet
- deductibleRemaining
- oopRemaining
- claimsYtdJson

AIContextSnapshot:
- id
- userId
- asOfDate
- contextJson
- version

6. Transaction ingestion flow
Implement a sync job/service:
- initial sync with /transactions/sync using empty cursor
- paginate until has_more = false
- persist added transactions
- update modified transactions
- mark removed transactions
- store new cursor
- run after item link and via background job / cron route later

7. Transaction normalization and categorization
Create a normalization layer that maps Plaid transactions into categories the AI can use.
Build heuristics and deterministic rules for:
- income / payroll
- rent
- mortgage
- utilities
- groceries
- dining
- transportation
- insurance
- debt payments
- medical spending
- subscriptions
- discretionary shopping
- cash withdrawals
- transfers ignored from spending if internal
- loan inflows not counted as earned income

Build merchant and pattern detection:
- identify likely rent or mortgage by recurring monthly payment + amount stability + keywords
- identify salary/payroll by recurring cadence + positive amount + employer keywords
- detect subscriptions by recurrence
- detect wasteful spending candidates:
  - excessive food delivery
  - many micro-purchases
  - duplicate subscriptions
  - high discretionary ratio
- detect financial stress signals:
  - overdraft-like low balance pattern
  - negative free cash flow
  - frequent credit card payments without savings buildup
  - paycheck-to-paycheck pattern
  - large medical expense spike

8. Analytics engine
Implement a service that computes:
- monthly gross inflow estimate
- reliable income estimate
- total monthly spend
- fixed vs variable spend
- median end-of-month balance
- free cash flow
- housing cost ratio
- debt burden estimate
- essential vs discretionary spend ratio
- recent 30/60/90 day spend trends
- emergency fund runway in months
- upcoming affordability score for a proposed medical bill

Build specific helpers:
- canUserPayAmountNow(amount)
- canUserPayAmountInInstallments(amount, months)
- shouldConsiderExternalFinancing(amount)
- shouldSuggestNegotiation(amount, providerType, hardshipSignals)
- shouldSuggestCharityCare(hardshipSignals, hospitalType)
- estimateSafeMonthlyMedicalPayment()

These functions should return structured outputs, not prose.

9. AI context builder
Create a backend function that assembles AI-safe context:
- transaction-derived financial summary
- recent key transactions
- subscription list
- income pattern summary
- housing/payment obligations
- insurance plan summary
- deductible remaining
- out-of-pocket max remaining
- affordability and hardship signals
- recommended decision flags

The output should be concise, structured JSON, optimized for LLM context.
Do not include raw secrets.
Do not dump all transactions into the model by default.
Instead include:
- summary metrics
- top recurring obligations
- recent relevant transactions
- confidence flags
- warnings about uncertain classification

Example structure:
{
  "financial_health": {...},
  "cash_flow": {...},
  "income": {...},
  "housing": {...},
  "subscriptions": [...],
  "wasteful_spending_signals": [...],
  "medical_affordability": {...},
  "insurance": {...},
  "recommended_actions": [...]
}

10. Development test interface
Build a minimal internal dev page or admin page where I can:
- create a sandbox link token
- link a sandbox institution
- create a fake sandbox item with custom data
- inject new sandbox transactions
- trigger transaction sync
- view normalized analytics
- inspect final AI context JSON

11. Seeded fake personas
Create at least 3 fake financial personas with different transaction histories:

Persona 1: Stable salaried worker
- monthly payroll
- rent
- groceries
- utilities
- moderate subscriptions
- healthy cash flow

Persona 2: Financially strained user
- lower income
- rent
- credit card payments
- BNPL or loan payments
- frequent overdraft risk
- inconsistent balances
- medical bill already present

Persona 3: Higher income but wasteful spender
- strong income
- dining and delivery overspend
- many subscriptions
- shopping-heavy discretionary spend
- can pay bills but needs optimization

Use custom sandbox user data for the main seeded history.
Use dynamic transaction injection to simulate a new medical bill event.

12. Code quality requirements
- Use TypeScript throughout
- Use clean service boundaries
- Avoid giant route files
- Add strong runtime validation with Zod
- Add comments only where useful
- Keep secrets server-only
- Encrypt stored access tokens
- Add structured logging
- Add clear error handling
- Make sandbox-only endpoints explicitly guarded

13. Docs
Create a detailed README covering:
- setup
- environment variables
- Plaid sandbox flow
- how fake data works
- how to create custom sandbox users
- how to inject transactions dynamically
- how analytics are computed
- how AI context is built
- limitations and next steps for production

14. Output expectations
Return:
- full file tree
- all created and modified files
- setup instructions
- example API route usage
- example seeded fake transaction payloads
- example AI context JSON generated from a test user

Important implementation decisions:
- Prefer /transactions/sync over legacy transaction polling
- Build the backend so Plaid raw data and AI-ready derived data are separate layers
- Build deterministic financial reasoning helpers first; AI narrative comes later
- Keep this implementation sandbox-safe and testable
- Do not implement production bank connectivity assumptions yet
- Do not skip the fake data generation capability

Start now by:
1. auditing the existing repo structure
2. identifying where Plaid should live
3. generating the DB schema and Plaid service layer
4. wiring the sandbox flow end to end
5. implementing analytics and AI context builder
6. documenting everything clearly
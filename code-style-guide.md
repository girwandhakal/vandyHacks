---
trigger: always_on
---


# Code Style Guide

This guide defines how AI coding agents should write and modify code in this repository. The goal is to produce code that is **correct, minimal, consistent with the existing codebase, and safe in concurrent environments**.

Agents must behave like disciplined senior engineers: make precise changes, preserve stability, and avoid unnecessary complexity.

---

# 1. Core Principles

- Correctness over cleverness.
- Make the **smallest possible change** to solve the problem.
- Prefer **readability over abstraction**.
- Avoid unnecessary complexity.
- Match **existing repository patterns**.
- Prefer explicit behavior over hidden magic.
- Maintain deterministic behavior unless randomness is explicitly required.

New code must look like it belongs in the repository.

---

# 2. Edit Discipline

When modifying code:

- Modify **only what is required**.
- Do not refactor unrelated code.
- Do not rename symbols unless necessary.
- Touch the **fewest files possible**.
- Avoid formatting changes in unrelated areas.
- Preserve public interfaces unless explicitly instructed otherwise.

If a change affects more than **5 files**, provide justification.

---

# 3. Code Structure Rules

### Functions
- Functions should be **small and single-purpose**.
- Validate inputs at boundaries.
- Use explicit return values.
- Avoid hidden side effects.

### Naming
- Use descriptive names.
- Avoid single-letter variables except in narrow contexts (loops, math).

### Modules
- Follow the existing folder structure.
- Reuse existing utilities before creating new ones.
- Avoid duplicate logic.

---

# 4. Error Handling

- Never swallow errors.
- Never suppress exceptions silently.
- Provide meaningful error messages with context.
- Log enough information to diagnose failures.
- Never log secrets or sensitive data.

Catch errors only when you can:

- recover safely
- add context
- clean up resources

---

# 5. Typing and Data Handling

- Use explicit types where supported.
- Prefer structured types over loose dictionaries.
- Validate external data at system boundaries.
- Treat `null`, `missing`, and `empty` as distinct states when relevant.

Avoid ambiguous return values.

---

# 6. Architecture Boundaries

Keep logic in the correct layer.

Typical layering:

- UI → presentation
- services → orchestration
- domain → business rules
- data layer → persistence
- infrastructure → external systems

Avoid mixing layers (for example: business logic inside UI components).

---

# 7. Dependency Rules

Default rule:

**Do not add dependencies.**

A new dependency must be justified by:

- clear functionality gain
- lack of existing solution
- acceptable maintenance risk

Prefer the standard library and existing project utilities.

Avoid large packages for small problems.

---

# 8. Security Rules

- Never hardcode secrets or credentials.
- Use environment variables for sensitive configuration.
- Validate external input.
- Do not weaken authentication or authorization logic.
- Do not log personal or sensitive data.

Security-sensitive code must not be modified without clear instruction.

---

# 9. Performance Rules

Write simple correct code first.

Avoid obvious inefficiencies such as:

- unnecessary nested loops
- repeated expensive work
- blocking operations in async flows
- large unnecessary allocations

Do not prematurely optimize.

Optimize only when justified.

---

# 10. Testing and Verification

The agent must distinguish between:

- code that appears correct
- code that was actually verified

Never claim code was tested unless it was run.

When behavior changes:

- update or add tests where appropriate
- preserve existing tests unless behavior intentionally changed

Always provide relevant verification commands such as:

- build
- test
- lint
- minimal runtime check

Test edge cases:

- invalid input
- empty values
- boundary cases
- concurrent access

---

# 11. Race Conditions and Concurrency Safety

A **race condition** occurs when correctness depends on execution timing between concurrent operations.

Unsafe pattern:

1. read shared state  
2. make decision  
3. write shared state

Another worker may modify the state between those steps.

## Common sources

- shared mutable memory
- concurrent database writes
- background jobs and API requests touching the same record
- retry logic
- duplicate requests
- async state updates
- file writes from multiple workers

## Guardrails

Always assume shared state can change concurrently.

Prefer:

- atomic operations
- transactions
- idempotent operations
- uniqueness constraints
- version checks

Avoid **check‑then‑act patterns**.

Safer approaches:

- database unique constraints
- upsert operations
- transactional writes
- idempotency keys

## Atomic operations

Avoid:

read → modify → write

Prefer:

- SQL `SET value = value + 1`
- atomic counters
- compare‑and‑swap updates

## Transactions

Use transactions when multiple writes must succeed together.

Examples:

- financial transfers
- order + inventory updates
- parent‑child record creation

Rules:

- keep transactions small
- avoid network calls inside transactions
- avoid long locks

## Idempotency

Distributed systems retry requests frequently.

Operations must be safe to repeat.

Use:

- idempotency keys
- unique request identifiers
- conflict‑safe insert logic

---

# 12. Comments and Documentation

Comments should explain **why**, not what.

Avoid narrating obvious code.

Update documentation when:

- commands change
- environment variables change
- setup steps change
- APIs change

Examples should be minimal and safe.

---

# 13. Output Expectations for the Agent

When returning a change include:

- modified files
- minimal explanation if needed
- assumptions if requirements were ambiguous
- verification commands
- suggested commit message when requested

Do not include:

- unrelated commentary
- speculative refactors
- claims of testing that did not occur

---

# 14. Definition of Good AI‑Generated Code

Good code is:

- correct
- minimal
- repository‑consistent
- concurrency‑safe
- secure
- testable
- maintainable

Prefer **boring, reliable solutions** over clever ones.

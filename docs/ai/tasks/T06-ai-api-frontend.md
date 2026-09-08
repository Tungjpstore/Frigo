# T06 — AI Layer + API + Frontend Integration

## Task ID

T06

## Title

AI Layer + API + Frontend Integration

## Objective

Expose the completed deterministic recipe/planning core through authenticated APIs and Frigo's existing frontend design language, adding bounded AI assistance only where it augments—not replaces—validated system decisions.

## Dependencies

T04 and T05 complete.

## Context

Frigo already has React/Vite client patterns, Hono `/api/v1` routes, Zod validation, tenant middleware, an AI provider router, and scan review flow. Existing static recipes and D1 data have not necessarily converged. All new endpoints must follow current cookie/CSRF, membership, idempotency/version, quota, error, and offline behavior conventions.

## In Scope

- Design authenticated, tenant-isolated API contracts for candidates, ranked recipes, plan generation/read/swap/regenerate, feedback, shopping list, and safe explanations.
- Add server-side validation, authorization, concurrency/idempotency behavior, pagination/limits, and response errors consistent with existing Worker conventions.
- Build frontend flows using existing visual patterns: recipe detail, plan view, swap/regenerate controls, shopping list, planner feedback, loading/empty/error/infeasible states, and clear provenance/uncertainty display.
- Integrate AI only for controlled assistance: canonical-normalization suggestions, long-tail recipe drafting, adaptations, cooking instructions, substitutions explanations, and plan explanations.
- Validate every AI output against schemas and route all critical quantities, allergy/dietary eligibility, expiry allocation, ranking, budget, and shopping arithmetic through the deterministic core.
- Provide user confirmation/review for low-confidence extraction or unverified generated content and distinguish curated, imported, user-generated, and AI-generated recipes.
- Before accepting user-generated recipes, add an explicit household-private draft/ownership and reviewed catalog publication boundary. Source type alone grants no write/publication permission; private recipes and provenance must not leak through global catalog endpoints.
- Add API/UI tests for authorization, validation, error/infeasibility states, safe AI fallback, and deterministic result display.

## Out of Scope

- Letting an LLM be the source of truth for inventory arithmetic, allergies, quantities, expiration, budgets, deterministic constraints/ranking, or permission decisions.
- PayOS/checkout changes, unrelated auth redesign, provider credential changes, full visual-system rewrite, or new optimization algorithm work that belongs to T02–T05.

## Required Deliverables

- Versioned, validated API DTOs and Worker route/service integration following current architecture.
- Accessible frontend surfaces consistent with current design and client data/error patterns.
- AI request provenance, confidence/verification state, schema validation, bounded failure handling, and explicit fallback messaging.
- Tests and documentation describing data flow, security boundaries, AI limitations, quota/cost/error behavior, and user review controls.

## Acceptance Criteria

- A household member cannot read or mutate another household's candidates, plans, feedback, shopping records, or generated artifacts.
- Requests with malformed quantities, unit IDs, unknown prohibited ingredients, stale versions, or unauthorized plan IDs fail safely and do not partially mutate data.
- UI never presents AI text as verified allergy/nutrition/budget/expiry truth; it displays deterministic data/provenance and sends ambiguous results to review.
- AI/provider outages return safe, actionable errors while deterministic recipe/planning operations continue where they do not require AI.
- Empty candidates, infeasible constraints/budget, and no-inventory states are visible and understandable rather than hidden by a fallback plan.
- API/UI tests prove core flows, error states, tenancy, and AI schema rejection; existing auth/CSRF/cookie and offline behavior remains intact.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm check:migrations
pnpm build
```

Run relevant Worker integration and browser/UI tests. Start the managed preview and capture fresh screenshot/interaction evidence for material UI changes. Do not claim visual verification without inspecting it.

## Known Risks

- AI providers may hallucinate, time out, leak cost, or return malformed structured data; treat outputs as untrusted inputs.
- Frontend legacy demo/offline fallbacks can mask server errors; follow the current fail-closed error policy.
- API work risks bypassing tenancy/idempotency controls if it does not reuse existing middleware/service patterns.

## Protected Areas

PayOS/billing/payment callbacks, unrelated auth/session/CSRF mechanics, deployment infrastructure, and deterministic decision logic owned by T02–T05.

## Expected Handoff

Update current state with endpoint/UI inventory, AI safeguards/provider behavior, test and UI evidence, feature flags, and known limitations. T07 begins with this complete subsystem and audits it without adding new product features.

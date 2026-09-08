# Frigo Recipe & Meal Planning Task Board

This board records the durable execution order. Read it with `CURRENT_STATE.md`,
`HANDOFF.md` and the active packet; source code/migrations remain implementation authority.

| Task | Status | Depends on | Exit condition |
| --- | --- | --- | --- |
| T01 — Domain & Data Foundation + AI Development Protocol | **COMPLETE** | — | Migrations 0019/0020, canonical ID/version/provenance contracts and protocol; 47 focused / 668 total tests and all local gates passed. |
| T02 — Recipe Engine | **COMPLETE** | T01 complete | Lot-aware quantity-only candidates, missing/unresolved semantics, scaling, approved substitutions, bounded family search and explicit catalog adapters; 106 focused / 774 total tests and all local gates passed. |
| T03 — Ranking & Personalization | **READY** | T02 complete | Separate eligibility and deterministic ranking consume T02 facts and authorized preferences/feedback, without LLM dependence. |
| T04 — Weekly Meal Planner | BLOCKED BY T03 | T02, T03 | Sequential lot-aware seven-day simulation enforces constraints and represents infeasibility. |
| T05 — Budget / Shopping / Waste Optimizer | BLOCKED BY T04 | T04 | Plan-level shopping, budget, package and waste optimization returns feasible or explicit infeasible results. |
| T06 — AI Layer + API + Frontend Integration | BLOCKED BY T04, T05 | T04, T05 | Authenticated APIs and existing-design UI expose the deterministic core; AI is bounded augmentation. |
| T07 — Hardening / Tests / Final Architecture Review | BLOCKED BY T03–T06 | T01–T06 | Integrity, safety, performance, concurrency, migration and end-to-end contracts are hardened after features. |

## Current checkpoint — 2026-09-08

T02 implementation: `0051276f61445437d323ca318378e16fc0ad6967` on
`hoplite/olbia-borysthenes-fbc61adc-recipe-engine-t02`. This state/handoff checkpoint
follows it. T01 PR #5 was explicitly authorized and merged as `ae0ed79`, resolving
an earlier stacked-branch ref collision. T01 implementation history remains intact.
T02 has not been merged; consult live branch/PR state for publication and hosted CI.

Final executed checks: `pnpm lint`, `pnpm typecheck`, `pnpm test` (**774 / 53**),
`pnpm build`, `pnpm check:migrations`,
`pnpm exec wrangler d1 migrations apply frigo-db --local`, `pnpm schema:check:local`,
`pnpm exec vitest run tests/unit/recipe-families.test.ts` (**14**),
`git diff --check`, `git diff --cached --check`: **PASS**.
No T02 migration, remote database operation, manual deployment or runtime cutover.

The initial two regression tests failed collection while their module was absent,
not two executed assertions. A seeded event-table fixture was corrected to assert
before/after equality. A final contextual-slot regression failed as intended before
its fix (1 failed / 13 skipped); all final gates ran again afterward. Exact commands,
counts, corrections and limitations are in `CURRENT_STATE.md` and `HANDOFF.md`.

## Next action

T03 is ready but has not started; it requires a separate task authorization.
First read the protocol/T03 packet and `RECIPE_ENGINE.md`; add a failing full-dish
eligibility regression over T02 candidates before defining scores. Full quantity
coverage must not override an allergen conflict or unknown hard-safety evidence.
Reuse T02 arithmetic and preserve empty/truncated outcomes without unsafe fallback.

## Operating rules

- Advance status only after packet acceptance and relevant checks pass; implementation presence is insufficient.
- `BLOCKED BY` forbids implementation until dependencies are complete unless a non-overlapping preparatory task is explicitly approved.
- Before every task inspect Git and read all files named in `AGENT_RULES.md` plus the active packet.
- Existing scoring/Week remains legacy capability, not completed T03–T05 functionality. `ALL_RECIPES`/D1 remain separate explicit sources.
- PayOS/payment code, unrelated authentication and production infrastructure are protected. Household isolation, inventory commands and Week compatibility stay intact.
- Update this board, `CURRENT_STATE.md` and `HANDOFF.md` with actual results and next action at every task boundary.
- Local verification is not hosted CI or deployment evidence. Merge/deployment require their own authorization.

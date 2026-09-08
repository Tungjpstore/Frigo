# Frigo Recipe & Meal Planning Task Board

This board is the durable execution order for the Recipe and Weekly Meal Planning Platform. Read it with `CURRENT_STATE.md` and the active task packet; source code and migrations remain the authority for implemented behavior.

| Task | Status | Depends on | Exit condition |
| --- | --- | --- | --- |
| T01 — Domain & Data Foundation + AI Development Protocol | **COMPLETE** | — | Migration 0019, validated catalog/domain contracts and all protocol files implemented; 638 tests, lint, typecheck, build, migration smoke and local D1 gate passed. |
| T02 — Recipe Engine | **READY** | T01 complete | Lot-aware candidate generation, availability/missing amounts, scaling, finite family variants, and deterministic substitutions are implemented without ranking. |
| T03 — Ranking & Personalization | BLOCKED BY T02 | T02 | Eligibility and deterministic ranking use persisted preferences and feedback without LLM dependence. |
| T04 — Weekly Meal Planner | BLOCKED BY T02, T03 | T02, T03 | A sequential, lot-aware seven-day plan simulation enforces constraints and represents infeasibility. |
| T05 — Budget / Shopping / Waste Optimizer | BLOCKED BY T04 | T04 | A plan-level shopping, budget, package, and waste optimizer returns feasible or explicit infeasible results. |
| T06 — AI Layer + API + Frontend Integration | BLOCKED BY T04, T05 | T04, T05 | Authenticated APIs and existing-design UI expose the deterministic core; AI is bounded augmentation only. |
| T07 — Hardening / Tests / Final Architecture Review | BLOCKED BY T01–T06 | T01–T06 | No major features remain; integrity, safety, performance, concurrency, migration, and end-to-end contracts are hardened. |

## Operating rules

Checkpoint verified 2026-09-08. Exact commands, limitations and next action are in
`CURRENT_STATE.md` and `HANDOFF.md`. No production deployment or runtime catalog
cutover occurred; existing scoring/Week is legacy capability, not completed T02–T05.

Team review: [PR #5](https://github.com/tun-vn/Frigo/pull/5) opened against `main`
on 2026-09-08, with automatic CI/review feedback tracking enabled. No merge or
deployment was performed. Publication follow-up is documentation-only; the
verified implementation and T01/T02 statuses are unchanged.

- Do not advance a status solely because code exists. Advance it only after the packet acceptance criteria and relevant checks pass.
- `BLOCKED BY` means implementation must not begin until its dependencies are complete unless a documented, non-overlapping preparatory task is explicitly approved.
- Before every task, inspect `git status`, `git diff`, and `git log --oneline -10`; then read all files named in `docs/ai/AGENT_RULES.md` and the active task packet.
- PayOS/payment code, unrelated authentication behavior, and deployment infrastructure are protected. Do not edit them without an explicit future-task authorization.
- Update this board, `CURRENT_STATE.md`, and `HANDOFF.md` with actual results at every task boundary.

# Frigo Recipe & Meal Planning Task Board

Source/migrations and live Git are authority. Read with CURRENT_STATE, HANDOFF and
active packet; implementation presence or local tests alone do not imply publication.

| Task | Status | Depends on | Exit condition |
| --- | --- | --- | --- |
| T01 — Domain & Data Foundation | **COMPLETE** | — | Additive 0019/0020, canonical identity/version/provenance contracts and development protocol. |
| T02 — Recipe Engine | **COMPLETE** | T01 | Merged `db09fa0`; lot-aware quantity-only candidates, scaling, substitutions, bounded families and explicit catalog adapters. All 106 T02 tests passed again in T03 preflight. |
| T03 — Ranking & Personalization | **COMPLETE** | T02 | Implementation `01f9d87` verified: 850 tests / 56 files and all local gates pass; published on the authorized thread branch in the user-confirmed repository. |
| T04 — Weekly Meal Planner | **READY** | T02, T03 | Sequential future meal simulation and explicit infeasibility. Not started; requires separate authorization. |
| T05 — Budget / Shopping / Waste Optimizer | BLOCKED BY T04 | T04 | Plan-level shopping, package, budget and waste optimization. |
| T06 — AI Layer + API + Frontend Integration | BLOCKED BY T04, T05 | T04, T05 | Authenticated integration with existing UI; AI bounded augmentation only. |
| T07 — Hardening / Tests / Final Architecture Review | BLOCKED BY T04–T06 | T01–T06 | Final safety, integrity, concurrency and end-to-end verification. |

## Current checkpoint — 2026-09-08

Branch `hoplite/stagiros-728cc726`; implementation
`01f9d874c72f67dc8b414caab926aba8d4be2f68`, based on merged T02 `db09fa0`.
Historical T02 handoff's unmerged status was corrected before T03 implementation.

The user confirmed publication to configured `ganghienteck-droid/Frigo` on
2026-09-08, resolving the original `tun-vn/Frigo` URL discrepancy. First-party push
confirmed branch head `c5695d3913f7ec3340ce1a261fc263243a1dddbe`; this state-only
checkpoint follows it. No remotes changed, PR created, merge or deployment attempted.

T03 implementation: hard filters before normalized deterministic ranking;
server-generated/evidence snapshot boundaries; nine transparent components;
scoped owner/member preferences, latest explicit tastes and decaying cooked/skip/
swap history; conservative unknown semantics; additive migration 0021; bulk context
and nutrition readers. T02 arithmetic and legacy routes/Week remain unchanged.

Executed final checks: `pnpm test` (**850 / 56**, including **76 new / 3**),
`pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm check:migrations`,
`pnpm exec wrangler d1 migrations apply frigo-db --local` (fresh final schema),
`pnpm schema:check:local`, `git diff --check`, `git diff --cached --check`: **PASS**.
No remote migration, deployment, frontend verification or hosted CI claimed.
Initial missing-module collection failure and intermediate concurrent type errors
were resolved; exact evidence and corrections are in CURRENT_STATE/HANDOFF.
These are the existing implementation verification results. The publication-only
follow-up changed documentation, checked Git/diffs and confirmed push; it did not
rerun application gates or modify implementation/migration bytes.

## Next action

T03 COMPLETE — T04 READY. Create/link a review PR if requested; merge/deployment
still require authorization. T04 must begin only as a separately authorized task
after reading its packet and the T02/T03 contracts. Do not implement T04 now.

## Operating rules

- Existing legacy scoring/Week is not completion of T03–T05 or permission for cutover.
- Read AGENT_RULES, required documents and active packet; inspect Git each task.
- Never rewrite applied migrations or silently import global/free-form preferences.
- PayOS/payment, unrelated auth/production infrastructure are protected. Preserve
  household isolation, inventory commands and Week compatibility.
- Update state/board/handoff with exact checks and next action at each boundary.
- Local verification is not hosted CI or deployment. Merge/deployment require authorization.

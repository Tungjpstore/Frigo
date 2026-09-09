# Frigo Recipe & Meal Planning Task Board

Source/migrations and live Git are authority. Read with CURRENT_STATE, HANDOFF and
active packet; implementation presence or local tests alone do not imply publication.

| Task | Status | Depends on | Exit condition |
| --- | --- | --- | --- |
| T01 — Domain & Data Foundation | **COMPLETE** | — | Additive 0019/0020, canonical identity/version/provenance contracts and development protocol. |
| T02 — Recipe Engine | **COMPLETE** | T01 | Merged `db09fa0`; lot-aware quantity-only candidates, scaling, substitutions, bounded families and explicit catalog adapters. Default behavior retained by T04's opt-in allocation extension. |
| T03 — Ranking & Personalization | **COMPLETE** | T02 | Immutable checkpoint `3592de9`; implementation `01f9d87`, 850 tests / 56 files and local gates verified. Ranking/personalization source unchanged by T04. |
| T04 — Weekly Meal Planner | **COMPLETE** | T02, T03 | Published hardening `d7dff8f` after `c28838c` / `a687a63` / handoff `7d76cdf`; sequential bounded planning, truthful incomplete-result metadata and evidence-backed nutrition reasons. 924 tests / 61 files and all final local gates pass. |
| T05 — Budget / Shopping / Waste Optimizer | **IN PROGRESS** | T04 | Authorized on hardened T04 `ebd538b`; deterministic purchase/package/budget/waste evaluation only, no replanning loop. |
| T06 — AI Layer + API + Frontend Integration | BLOCKED BY T05 | T04, T05 | Authenticated integration with existing UI; read-only planner shadow/canary path, AI bounded augmentation only. |
| T07 — Hardening / Tests / Final Architecture Review | BLOCKED BY T05, T06 | T01–T06 | Final safety, integrity, concurrency and end-to-end verification. |

## Current checkpoint — 2026-09-09

Repository `ganghienteck-droid/Frigo`, confirmed by the user; branch
`hoplite/stagiros-728cc726`. T04 is temporarily stacked on this existing branch
because Hoplite could not allocate a dependent branch. Explicit user authorization
permits new commits only, after immutable T03 `3592de9832a55a06d4af6fa31491c8f3c0321262`.
Pre-edit tree was clean and HEAD matched. No history rewrite or main merge occurred.

T04 commits:
1. `c28838cf22ee05c6b7eacef0a89091c95846e4ae` — isolated minimal expiry-allocation
   compatibility change and standalone T02 regression.
2. `a687a63817fc153849c255562bbf62c1da475e9a` — bounded sequential planner, tests,
   contract and ADR-014.
3. `7d76cdfd9efe4cded3af4b7eb102f7ba57c3b624` — original verified T04 handoff.
4. `d7dff8f5b986c141ddddb464e86524a3a367392a` — surgical result/explanation
   hardening, eight regressions and contract clarification. First-party push confirmed.

Implementation range: `3592de9..d7dff8f5b986c141ddddb464e86524a3a367392a`.
This documentation-only checkpoint follows the confirmed implementation push and
cannot name itself; inspect `git log --reverse --format='%H %s' 3592de9..HEAD` for
the full T04 range including handoff. No PR, remote migration or deployment.

Hardening preflight was clean at `7d76cdf`, with all required commits and no
architecture drift. Finding A was **ALREADY_SAFE**; B and C were **CONFIRMED**.
Unproven results now use `no_plan_found_without_proof` with sorted source-tagged
incomplete reasons, not a false limit claim. Nutrition support requires above-neutral
qualified evidence covering the current meal; scoring/selection rules are unchanged.

Final executed gates: `pnpm test` (**924 / 61**, **74 added since T03**), `pnpm lint`,
`pnpm typecheck`, `pnpm build`, `pnpm check:migrations`, `pnpm schema:check:local`,
`git diff --check`, `git diff --cached --check`: **PASS**. Final source/tests were
unchanged after those gates. Five new test files contain 73 tests; the allocation
regression adds one to the existing candidate suite. Stress: 21 slots / 100 recipes,
200-state test cap, deterministic output, bounded frontier/branching and visible
truncation. Logs: `.hoplite/artifacts/t04-hardening/final/` (ignored).

Focused relevant T02/T03 and all T04 tests: **208 / 8 PASS**. Before the fix,
the two-file regression run reported **9 failed / 38 passed**; all are corrected.
Exact commands and independent review evidence are in CURRENT_STATE/HANDOFF.

Initial shopping-projection failure (1 failed / 19 passed), intermediate typing
issues and review corrections are resolved and recorded in CURRENT_STATE/HANDOFF.
UI/preview and hosted CI **NOT RUN**; remote D1/deployment **NOT RUN / not authorized**.
No migration needed. Protected paths, T03 ranking and legacy Week remain unchanged.

## Next action

**T04 COMPLETE — T05 READY**, not started. Review T04, then separately authorize
T05 if desired. First verify the hardened checkpoint and read its packet plus the
updated T04 contract, then audit existing shopping/price/package helpers. T05 must
use selected demands/shortages/final projection without subtracting stock twice;
T04 expiry allocation is not a globally waste-optimal purchase policy. T06 owns the documented authenticated shadow path;
leftovers, DST handling and production acceptance remain explicit future limitations.
Create/link a PR only if requested and subscribe to auto-fix if created. Do not
merge or deploy without authorization.

## Operating rules

- Existing legacy scoring/Week is not completion of T05–T07 or permission for cutover.
- Read AGENT_RULES, required documents and active packet; inspect Git each task.
- Never rewrite applied migrations or silently import global/free-form preferences.
- PayOS/payment, unrelated auth/production infrastructure are protected. Preserve
  household isolation, inventory commands and Week compatibility.
- Update state/board/handoff with exact checks and next action at each boundary.
- Local verification is not hosted CI or deployment. Merge/deployment require authorization.

# T06B continuation verification

## Baseline and scope

Continuation began on 2026-09-09 from clean
`c5f86232f572b3194cdff5e0b8113dd254ab15fe`. `git merge-base --is-ancestor`
passed for both this WIP and `c46330c` (verified T06A). The current authorized
workspace is `sex-vn/Frigo`, branch `hoplite/mende-90a2dbb1`; historical branch
`hoplite/leukas-32474504` and repository names were not silently substituted.
The entire `1f7802f` → `08d90fa` → `c5f8623` chain is preserved, with no reset,
reimplementation or lost required source.

Reused backend discovery/alternatives/explanation seams, typed client, existing
routes/components/hooks, deterministic presentation, real isolated preview,
HTTP/AI tests and legacy coexistence. Continuation changes are frontend tests,
small test-proven frontend corrections, native-browser replay and documentation.
No Worker/API/schema compatibility correction was required in this continuation.

## Feature audit

Initial classifications distinguish incomplete verification from missing source.
No replacement components or new domain functionality were needed.

| Feature | Initial audit | Final evidence |
| --- | --- | --- |
| Current/recent private restoration | PARTIAL: implementation present, final isolation/reload proof missing | Mounted null/existing/invalid/unauthorized/owner/reset cases; real browser reload |
| Planner route/setup | PARTIAL: source complete, creation retry identity audit missing | Mounted routes, validated intent; browser empty→setup→seven-day plan |
| Weekly cards | PARTIAL: search limit-only diagnostics omitted | Semantic complete/partial/infeasible/no-proof/truncated tests; both mobile locales |
| Meal detail | COMPLETE source, interaction proof missing | Quantities/steps/unknown nutrition/safety/escaped text tests; browser open/back |
| Swap | PARTIAL: stale alternatives retry and native reverse-Tab focus defects | Full revision, infeasible/network failure preservation, real 409 alternatives recovery, native focus checks |
| Regenerate | PARTIAL: cache recovery cases unverified | Revision replacement, duplicate gate, failed mutation preservation, real browser confirmation |
| Stale/revalidation | PARTIAL: current cache/alternatives not replaced after 409; failed refetch could claim recovery | Mounted regression and real inventory/revision conflicts; no raw 409 |
| Shopping | PARTIAL: no-option/optional/availability wording incomplete | Rendered semantics, old-revision hiding, in-flight/cache invalidation, real browser requests |
| Budget | COMPLETE source, matrix not verified | All four budget states; known vs unknown and exact huge money tests |
| Feedback | COMPLETE source, interactions not verified | All five actions in browser; mounted cooked receipt; server `inventoryMutated:false` |
| Unknown prices | COMPLETE source, render proof missing | JPY 4,820 known subtotal + two unknown items; all-unknown real catalog; no false total |
| Incomplete/truncated plans | PARTIAL: cap-only reasons absent | Limits now disclosed; no-proof not presented as proven infeasible |
| Mobile | PARTIAL: historical vi week only | 375×812 English, 390×844 Vietnamese across setup/week/detail/swap/shopping/budget/stale/feedback |
| Accessibility | PARTIAL: native Shift+Tab could leave modal | Labeled controls/dialogs, semantic status, focus entry/wrap/return, native Escape |
| AI explanations | COMPLETE server architecture, UI proof missing | Structured reason rendering and real disabled-AI browser fallback; enabled/failure HTTP/unit tests |
| Deterministic fallback | COMPLETE source, integrated proof missing | Planner usable without AI; no untrusted HTML rendering |

## Test-proven corrections and failures

- Original hook control against the same 41 mounted tests: **10 failed / 31
  passed**. Session reset retained busy/error/key state; an obsolete operation
  could interfere with a newer operation's gate; 409 recovery left current-plan/
  alternatives caches stale; a failed refetch could claim refreshed data. Operation
  tokens, session resets and full successful recovery replacement fix those cases.
- Existing cancel-before-set already worked. It was preserved, not redesigned:
  late detail/current GET cannot overwrite a newer mutation revision. Shopping
  results are revision-bound and removed on plan replacement; stale requests do
  not become authority for a different revision/session.
- Public reason/status audit exposed important unmapped inventory, candidate,
  substitution, planning and purchase codes. Both locales intentionally map every
  extracted current public code; only genuinely new codes get generic fallback.
- Component assertions require limit-only reasons, purchase availability,
  no-option vs no-proof, and optional exclusion from purchases/budget. Small
  presentation changes preserve backend semantics. `CANDIDATE_MODE` does not imply
  the engine silently changed the requested planning mode.
- Native browser Shift+Tab from the swap Cancel button failed containment:
  `document.activeElement` was the document body while the dialog stayed open.
  Planner-only Tab wrap now passes real Shift+Tab, Tab, Escape and focus return.
- Real browser alternatives conflict reproduced a timeout after Try again because
  it repeated the old-revision request. Recovery now reads/replaces the entire plan;
  obsolete choices close and reopening loads the latest revision without a swap.
- A test-only TS2571 from unknown `Response.json().plan` was corrected using the
  typed current-plan client; no assertion/type safety was weakened.
- Initial vi browser fixture assertion assumed English comma grouping. Corrected
  the assertion to the locale's grouping (`4.820` in vi); application formatting
  was correct. Native CLI top-level `await` and one incorrect selector were harness
  invocation errors, corrected to promise evaluation and actual accessible names.
- Platform setup falsely reported tracked `.hoplite/settings.json` missing and
  rejected the setup lifecycle claim. Exact repository setup/run commands were
  mirrored to project overrides; the exact setup ran successfully via shell.
  Node 24.19.0, sqlite3 and locked pnpm dependencies were used. Reported to Hoplite;
  no production setup/auth/payment infrastructure was changed.

## Focused executed evidence

These sets overlap; do not sum them as independent totals.

| Command | Result |
| --- | --- |
| `pnpm exec vitest run tests/unit/meal-planning-client.test.ts tests/unit/planner-presentation.test.ts` before changes | PASS: 80 tests / 2 files |
| `pnpm typecheck`; `pnpm lint` before new implementation | PASS, both exit 0 |
| `pnpm exec vitest run tests/unit/planner-ui.test.tsx tests/unit/planner-reason-coverage.test.ts tests/unit/meal-planning-client.test.ts tests/unit/planner-presentation.test.ts` | PASS: 144 tests / 4 files (58 component, 6 reason, 24 client, 56 formatting/presentation) |
| `pnpm exec vitest run tests/integration/meal-planning-presentation-http.test.ts tests/unit/meal-planning-explanation.test.ts tests/integration/meal-planning-http.test.ts tests/integration/meal-planning-persistence.test.ts tests/e2e/planner-preview.test.mjs` | PASS: 110 tests / 5 files (27 presentation HTTP, 18 AI, 42 T06A HTTP, 6 persistence, 17 preview API) |
| `pnpm exec vitest run tests/unit/planner-hook.test.tsx` before final creation-key follow-up | PASS: 41 mounted tests / 1 file (10 restoration, 15 revision/shopping, 8 session, 8 interactions) |
| `pnpm exec wrangler d1 migrations apply frigo-db --local` | PASS: local schema 0001–0022; no remote call |
| `pnpm schema:check:local` | PASS: required schema, indexes, foreign keys and generated-plan storage |

## Final gates and counts

Final integrated gates and verified implementation SHA are filled only after
execution. T06B is not complete while this section remains pending.

## Browser evidence interpretation

Replay: managed `browser_cli` `batch --bail`, finite stdin from
`tests/e2e/planner-browser.commands.json`; see `T06B_E2E.md` for exact phases.
Expected complete matrix: 44 named assertions per locale, 88 total across 12 phase
executions. Report browser assertion counts separately from Vitest case counts.
Real Worker flows cover happy/uncertainty/stale/current restoration and conflicts;
mixed-price/429 substitutions are explicitly frontend presentation evidence only.
No actual retail catalog, live provider or production deployment is certified.

## Architecture self-review

- Frontend never calculates authoritative shortages, stock feasibility, allergy
  safety, package selection, shopping totals or budget truth. Formatting exact
  DTOs and parsing budget intent do not confer domain authority.
- Strict backend request schemas reject fake price/meal/context fields. Household
  and private creator are session-owned, not accepted as client authority.
- AI only reorders every grounded reason ID exactly once. It cannot change facts,
  recommendations or meals; failure cannot block deterministic planning.
- Unknown money/nutrition are not zero; known subtotal is not complete total;
  best-known is not proven cheapest; purchase surplus is not certain waste.
- Swap/regenerate send revision intent, accept complete server revisions and remove
  old shopping/alternatives. Canceled query delivery and session fences reject late
  old results. Reload discovers the server's current private plan.
- Cooked is annotation only; generation does not consume inventory; checklist
  controls do not purchase/pay/add stock. No T02–T05 algorithm was reimplemented,
  no T06A trust boundary was weakened, and no PayOS/payment code was touched.

## Non-blocking T07 limitations

Best-effort per-account/per-path rate limits are not aggregate cross-plan quotas.
T05 package preselection/temporal splitting and broader production security remain
T07, not implemented here. Reviewed retail/safety data remain absent unless supplied
through trusted composition; missing evidence fails closed or stays unknown.
Native AI timeout cannot guarantee provider cancellation. Live-provider evaluation,
production migrations/deployment, full plan/revision/feedback history, reviewed
catalog localization and AI-generated recipes are not claimed. Existing safe DTO
omits nutrient values/substitution traces; no frontend facts are invented to fill it.

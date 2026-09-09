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
- Repeated deliberate creation with identical settings reused a completed key.
  Successful creation now retires that key; failed/lost-response retries retain it.
  Mounted navigation regressions prove new creation and exact retry separately.
  Two test-only loading-button selectors were corrected to retain the original
  button node without weakening disabled/duplicate-submit assertions.
- A test-only TS2571 from unknown `Response.json().plan` was corrected using the
  typed current-plan client; no assertion/type safety was weakened.
- Initial vi browser fixture assertion assumed English comma grouping. Corrected
  the assertion to the locale's grouping (`4.820` in vi); application formatting
  was correct. Native CLI top-level `await` and one incorrect selector were harness
  invocation errors, corrected to promise evaluation and actual accessible names.
- The final browser replay exposed a harness readiness race: a retained mutation
  conflict alert appeared while the alternatives query was still pending. The
  waiter now requires the alternatives alert's enabled retry action, not any alert.
  A subsequent snapshot confirmed that action appeared normally; no product
  assertion was removed and no application-source change was needed.
- Platform setup falsely reported tracked `.hoplite/settings.json` missing and
  rejected the setup lifecycle claim. Exact repository setup/run commands were
  mirrored to project overrides; the exact setup ran successfully via shell.
  Node 24.19.0, sqlite3 and locked pnpm dependencies were used. Reported to Hoplite;
  no production setup/auth/payment infrastructure was changed.
- Editing hook structure while the dev browser was open left two historical React
  hot-reload errors in the browser buffer. Clean document/browser reloads are used
  for final replay, not those intermediate HMR states. Retired scratch jsdom
  dependencies were removed after the durable locked install; no symlinked
  scratch dependency tree remains in browser capture artifacts.

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

Verified implementation SHA: **`0fc78a4fdc624973413259c048e65ed585fa2b8e`**,
published on `hoplite/mende-90a2dbb1`. Final source was frozen before these runs.
The earlier 1,386-test integrated run preceded four additional mounted tests and
is not the final count. Logs: `.hoplite/artifacts/t06b/verified-code-*.log`.

| Exact command | Result on verified implementation |
| --- | --- |
| `pnpm test` | PASS, exit 0: **1,390 tests / 79 files**, no failures/skips |
| `pnpm lint` | PASS, exit 0 |
| `pnpm typecheck` | PASS, exit 0; web/tests and Worker |
| `pnpm build` | PASS, exit 0; Vite and Worker TypeScript |
| `pnpm check:migrations` | PASS, exit 0, `migration-smoke=ok` |
| `pnpm schema:check:local` | PASS, exit 0 |
| `pnpm install --frozen-lockfile` | PASS; jsdom 26.1.0 is the sole new direct test dependency, no unrelated upgrades |

Final suites, overlapping categories clearly separated:

- `tests/unit`: **1,015 tests / 55 files**, including component and mounted tests.
- `tests/integration`: **358 tests / 23 files**.
- `tests/e2e/planner-preview.test.mjs`: **17 API integration tests / 1 file**.
- T06B frontend: **192 tests / 5 files** = client 24, presentation 56, semantic
  components 58, reason/status coverage 6, mounted hooks/interactions 48.
- Mounted 48 = restoration 10, revision/shopping races 15, session fencing 8,
  generation interactions 4, other mutation/feedback interactions 11.
- T06A/T06B planning HTTP: **69 / 2 files** (42 + 27), plus preview API 17 above.
- AI grounding/fallback unit: **18 / 1 file**; HTTP/provider fencing also covered.
- T06B-specific addition suites: **254 / 8 files** (frontend 192 + presentation
  HTTP 27 + AI 18 + preview API 17). Other T06A regressions remain in the full suite.
- Browser: **88 named assertions / 12 phase executions**, both required locales/
  viewports; **PASS** on the committed implementation. These are not Vitest cases.

Focused frontend command executed on this SHA:
`pnpm exec vitest run tests/unit/planner-ui.test.tsx tests/unit/planner-hook.test.tsx tests/unit/planner-reason-coverage.test.ts tests/unit/planner-presentation.test.ts tests/unit/meal-planning-client.test.ts --reporter=json --outputFile=.hoplite/artifacts/t06b/final-frontend.json`
— **192 passed**, five files. API/AI/preview suites also run inside `pnpm test`.

This subsequent documentation-only checkpoint cannot contain its own future SHA.
Resolve it with `git log -1 --format=%H -- docs/ai/HANDOFF.md`. Final closure reruns
the same full gates and browser command matrix on that exact committed HEAD;
the final response records its SHA/results. A browser-only readiness-wait follow-up
is documented above and is included in that final rerun. Application source remains
identical to the verified implementation SHA.

## Browser evidence interpretation

Replay: managed `browser_cli` `batch --bail`, finite stdin from
`tests/e2e/planner-browser.commands.json`; see `T06B_E2E.md` for exact phases.
Completed matrix: 44 named assertions per locale, 88 total across 12 phase
executions. Browser assertion counts are separate from Vitest case counts.
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

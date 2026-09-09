# T07 final frozen-source verification

## Immutable source and task verdict

**Frozen application/test revision:**
`f9d2ff871da155ba7f1aaedd3112a5ed6ea8d2c0`.

All final checks below ran after this clean committed revision was published.
No application, test, migration, dependency, config or script source changed
subsequently; the final receipt/status updates are documentation only.

**T07 COMPLETE WITH NON-BLOCKING FOLLOW-UPS.** No reproduced critical/high planner
finding remains unfixed. This is a locally verified release candidate, **not
production deployment approval**. Hosted CI remains unverified; exact-head hosted
CI and existing operator release/schema approval remain required before release.

Original T07 branch: `hoplite/lipara-d81160ee`.
Published continuation checkpoint: `006742bc179d58aae53106c88aff8a2667dbd1ca`.
Writable continuation branch: `hoplite/prokonnesos-74e71894`.
This is intentional publisher topology, not an architectural issue. Exact recovery
`f39180421f12ff68751dba7898aa39535b2d3a95` is preserved as an ancestor.

## Final gate receipt — 2026-09-09

| Exact command | Confirmed result | Observed wall time |
| --- | --- | ---: |
| `pnpm test` | **1,487 tests / 87 files PASS**, Vitest 97.68 s | 98.725 s |
| `pnpm lint` | PASS, exit 0 | 8.075 s |
| `pnpm typecheck` | PASS, web/shared and Worker targets | 22.178 s |
| `pnpm build` | PASS, Vite + Worker TypeScript; Vite 12.17 s | 20.272 s |
| `pnpm check:migrations` | PASS, `migration-smoke=ok` | 1.380 s |
| `pnpm exec wrangler d1 migrations apply frigo-db --local` | PASS, clean local replay 0001–0022 | 13.671 s |
| `pnpm schema:check:local` | PASS, ledger/schema/Week/ranking/generated-plan/FK gates | 2.112 s |
| `node scripts/t07-query-plans.mjs` | PASS, expected ownership indexes and `foreignKeyCheck: []` | Not separately timed |
| focused command below | **819 tests / 40 files PASS**, Vitest 34.28 s | 35.355 s |
| `git diff --check` | PASS | Not separately timed |

Earlier local Wrangler state was **moved**, not deleted, to ignored
`.hoplite/artifacts/t07/final/pre-freeze-d1` before the clean local apply. Managed
preview uses separate in-memory SQLite and was not affected. No remote command ran.
Migration 0018 is merely part of the existing replay chain; no payment migration
or other applied migration was edited. Ordinary build flags remained off/default;
both legacy Week and new planner code compiled.

Lint/types/build and browser work overlapped the full suite; timings are real
shared-sandbox observations, not benchmark thresholds. All gates passed on their
first actual final execution. Initial shell command wrappers were blocked by
platform policy before execution, then replaced by equivalent static commands;
those tool rejections are not application-test failures.

## Exact focused command

```sh
pnpm exec vitest run tests/unit/quantity.test.ts tests/unit/ingredient-availability.test.ts tests/unit/recipe-candidates.test.ts tests/unit/recipe-families.test.ts tests/integration/recipe-candidates.test.ts tests/integration/recipe-catalog.test.ts recipe-ranking recipe-personalization ranking-nutrition planner-contract planner-inventory planner-nutrition weekly-planner shopping-catalog shopping-hardening shopping-optimizer shopping-plan-snapshot shopping-search meal-planning meal-shopping-dto planner-hook planner-presentation planner-reason-coverage planner-ui planner-preview t07
```

The 819 focused tests are a subset of the 1,487 full tests; do not add their counts.
T07 adds **97 regressions / 8 files** over the preserved 1,390/79 baseline. Changed
existing assertions account for the intentionally shared compute budget and normal
Zod cross-field refinement; no coverage was removed to suppress a real failure.
Pre-fix failures and corrected test-fixture assumptions are documented per phase.

## Fresh browser verification

Managed Vite/Worker preview, actual synthetic registered cookie, isolated SQLite,
no external backend fetch. Executed all **121 commands** in
`tests/e2e/t07-planner-browser.commands.json`, in six ordered per-combination
chunks. All reset/login steps and all six real 61-second rate-window waits were
retained; no limiter bypass or response substitution for real-worker phases.

| Viewport | English | Vietnamese | Page errors |
| --- | ---: | ---: | --- |
| 375×812 | 44/44 PASS | 44/44 PASS | `[]` after each combination |
| 390×844 | 44/44 PASS | 44/44 PASS | `[]` after each combination |
| 1280×900 | 44/44 PASS | 44/44 PASS | `[]` after each combination |

**264 named assertions / 36 phase executions PASS**: per combination happy flow
30, actual reload restoration 2, presentation failure fixtures 5, actual revision
conflict 2, alternatives conflict 2, and native keyboard/focus checks 3. Flows
cover generation, seven meals, details, swap/cancel, all feedback, grounded AI
fallback, JPY uncertainty/budget, shopping invalidation, regeneration and stale
recovery. Explicit frontend fixtures supply known subtotal/unknown-price/429
presentation cases; those are not claims of a live retailer catalog.

The browser fixture has one registered user. Actual account-B-cookie login is not
covered by this browser matrix; real-auth cross-actor HTTP and mounted A→B session
regressions cover those separate boundaries. Failed/malformed 409 recovery and late
old GET are mounted tests, not misrepresented as separate real-browser scenarios.
No live provider, production data, screen reader or physical touch-device test.

Afterward the parent reopened `/planner`, inspected the current DOM (seven meals,
revision 6, explicit non-optimality/uncertainty text and legacy Week link), and
captured one synthetic-only desktop screenshot. No recordings or private media.

The fresh synthetic screenshot is shared in the thread and review PR, not committed
as a binary or exposed through a production-data artifact.

## Final operational sample

The full frozen suite emitted the following representative synthetic measurement:
generate **147.70 ms / 40 statements / 9,822 bytes / 103 states**;
regenerate **68.39 ms / 38 / 9,822 / 103**;
swap **76.31 ms / 38 / 9,801 / 86**;
shopping **9.63 ms / 21 / 4,891**;
current **5.89 ms / 21 / 9,810**. Generate/regenerate/swap use two source batches;
shopping/current one. Missing reviewed catalog is explicit. These are not
production latency/capacity promises; methodology and limits are in H6.

## Privacy, protected areas and Git review

- High-confidence private-key/token marker scan of `src`, `packages`, `tests` and
  `dist/client` returned **no matches**, reporting filenames only if found. This is
  bounded detection, not a full historical/provider secret audit.
- Full application diff reviewed: five implementation files, minimal changes;
  no unrelated auth/session, Week, inventory-command or production-policy edit.
- Explicit `git diff --exit-code 006742b HEAD` comparisons for migrations,
  dependencies/lockfile, Wrangler config, `.github`, `.hoplite`, auth/session and
  payment-related paths passed. **PayOS/payment code untouched.**
- Ancestor checks for both `006742b` and exact `f391804` passed. Worktree was clean
  at freeze and after all final gates/browser execution. Required evidence is in
  tracked docs/scripts/tests; transient logs/screenshots remain ignored artifacts.

## Hosted CI and release limitation

A one-shot provider query for completed push CI on exact frozen SHA returned no
runs. Existing `.github/workflows/ci.yml` triggers topic PR validation only against
main/master, not this thread's configured checkpoint base, and has no manual
entrypoint. **Hosted CI not verified**; no workflow/deployment was dispatched or
rewritten to force it. No remote schema, production canary or deployment evidence.
Review `PRODUCTION_READINESS.md` and H6's staged enablement/rollback instructions
before requesting a separately authorized release.

## Published phase checkpoints

| Phase | Commit |
| --- | --- |
| Preserved recovery | `f39180421f12ff68751dba7898aa39535b2d3a95` |
| H1 security/trust | `65c1367c82bdbd4c47eac70671c0fb3420e07c0f` |
| H2 aggregate abuse controls | `55020bc95790a06f82cbf5b04b4a1fa77b6be884` |
| H3 CAS response integrity | `a19063bed988b9507c65b04cd63b5d5574b0df2b` |
| H4 currency-scale contract | `865ee910350a64def3e5c2a7bc448fa7af6313f7` |
| H5 session/privacy/recovery | `d5797987c492d73ce0a7a4ca845b77b94e293fa5` |
| H6 evidence / final frozen candidate | `f9d2ff871da155ba7f1aaedd3112a5ed6ea8d2c0` |

Final documentation commit is intentionally later than the frozen application SHA;
its source equivalence must be verified before publication. No rewrite/reset or
post-freeze application-source edit is required.

# Current State — Recipe / Meal Planning Program

Verified 2026-09-08. **T02 COMPLETE — T03 READY**. This completes the deterministic
Recipe Engine packet, not the seven-task platform or a runtime/deployment cutover.

## Checkpoint and repository assessment

Last verified implementation: `0051276f61445437d323ca318378e16fc0ad6967`
(`feat(recipe-engine): add deterministic lot-aware candidates and bounded families`).
Branch: `hoplite/olbia-borysthenes-fbc61adc-recipe-engine-t02`, based on `main` at
`ae0ed794abacdb97792b0013f332e0ee67fb3270`. This state-only checkpoint follows that
implementation; it does not attempt to name its own commit. Read live branch/PR
state for publication and hosted checks. No T02 merge or manual deployment occurred.

Preflight read the required protocol/task documents and inspected Git, domain,
recipes, inventory persistence, Week, migrations and tests. T01 was COMPLETE and
T02 READY. T01 code/migrations matched implementation `a730da85967284afb2071140d51a3ea1c39dac9f`.
One documentation-only mismatch was resolved before implementation continued:
`tsconfig.json` includes TS/TSX tests, contrary to an older handoff note; confirmed
with `tsc --listFilesOnly`. No compiler configuration changed.

PR #5 was merged with explicit user authorization at `ae0ed79`, resolving a Git
ref-prefix collision that prevented a stacked T02 branch. The independent T02
branch was then allocated by the platform. T01's exact historical findings and
checks remain in `ae0ed79:docs/ai/CURRENT_STATE.md`; those are not T02 results.

## Implemented

- `domain/src/{availability,quantity,units}.ts`: reusable canonical lot index,
  strict physical factors, rational intermediate arithmetic, validation/quarantine,
  explicit expiry uncertainty and per-candidate quantity-reservation witnesses.
  Existing unit exports/legacy fallback semantics remain available.
- `recipes/src/requirements.ts`: aggregate repeated compatible demands before
  serving scaling; separate required/optional and contextual lines; retain source
  indices, units and explicit fractional-count policy.
- `recipes/src/substitutions.ts`: reviewed, source-referenced, version-scoped,
  per-call-approved one-hop substitutions. Every active constraint needs evidence.
  Reserve all direct required demand before substitutes and optional ingredients.
- `recipes/src/families.ts`: lazy binary-ordered DFS with 64-candidate/1024-state
  upper bounds enforced during search. Rejected/partial states count; selected and
  omitted slots remain traceable; measurable semantic duplicates are suppressed.
  Contextual lines/slot identities remain distinct without package equivalence.
- `recipes/src/candidates.ts`: deterministic cook-now/shopping-allowed candidates,
  required/optional coverage, exact known shortages, unresolved evidence, exclusions,
  source/version identities, independent lot witnesses and raw rescue-lot flags.
  `eligibilityScope: 'quantity_only'` is not an allergy/nutrition certificate.
- `recipes/src/catalog.ts` and `db/src/recipe-catalog.ts`: explicit validated static,
  D1 or provided snapshots; D1 uses one read-only batch of eight SELECTs. Drift audit
  includes duplicate requirement counts and review-only alias collision proposals.
- New `RECIPE_ENGINE.md`, ADR-011/012, architecture/domain/task packet updates and
  a precise T03 entry point. No T03 implementation or new persistence schema.

## Important contracts

`generateRecipeCandidates` requires an explicit calendar `asOfDate`, positive
safe-integer requested servings and an authorized inventory snapshot. Supplying
`householdId` excludes mismatching/unscoped rows; unscoped mixed-household input
throws. This library does not authenticate callers or read household permissions.

`satisfied` proves coverage; `partial` and `missing` carry numeric shortages;
`unresolved` carries `missingQuantity: null`. 200 g + 0.15 kg yields 350 g and covers
300 g. A pack cannot provide invented grams or prove equivalence to another pack.
Optional shortages do not invalidate candidates. Shopping mode retains valid
incomplete/unresolved recipes; cook-now requires all required demands satisfied.

Identical lot IDs count once; conflicting duplicates and malformed related rows
produce uncertainty. Past use-by is unavailable; past best-before is not treated
as automatically unsafe; elapsed unknown/estimated dates need review. Lot-ID order
is a feasibility witness, not FEFO or consumption. Each candidate starts afresh.
One egg at two servings scales to 1.5 pieces at three with explicit flags, not hidden
rounding. Unknown facts remain unknown; unsupported numeric ranges fail explicitly.

Budget-truncated family searches expose `truncated` and `exhaustive: false`; zero
results are not proof that no feasible variant exists. See `RECIPE_ENGINE.md` for
full field, substitution, scaling, allocation and T03 consumer semantics.

## Verification — final implementation content

Executed in the sandbox with Node v24.19.0 and pnpm 10.26.0. All source/test changes
were included before the final full run; only state/handoff documentation follows.

| Exact command | Result |
| --- | --- |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS — web/packages/TS tests and Worker |
| `pnpm test` | PASS — **774 tests / 53 files**; T02 adds **106 tests / 6 files** to T01's 668 / 47 |
| `pnpm build` | PASS — Vite client and Worker TypeScript |
| `pnpm check:migrations` | PASS — `migration-smoke=ok` |
| `pnpm exec wrangler d1 migrations apply frigo-db --local` | PASS — no migrations to apply |
| `pnpm schema:check:local` | PASS — required ledger/schema, foundation guards and foreign keys |
| `pnpm exec vitest run tests/unit/recipe-families.test.ts` | PASS — 14 tests after contextual-slot fix |
| `git diff --check`, `git diff --cached --check` | PASS |
| Protected-path/prior-migration diff against `ae0ed79` | Empty; source changes limited to the new library modules and barrel exports |

Focused counts from the full run: availability 29, quantity 11, candidates 42,
families 14, D1 catalog 7, D1 candidates 3. Tests cover A–O of the T02 request,
including empty-fridge modes, repeated demand, optional priority, invalid rows,
count scaling, approved/denied substitutions, huge/rejected family searches,
determinism, static/D1 drift and read-only inventory-event preservation.

### Failures and corrections

- The initial two availability regressions were written before the module existed;
  their first run failed collection (missing module), not two executed assertions.
  Do not misrepresent this historical red run. Both assertions now pass, including
  persisted D1 recipe/inventory coverage for the same scenarios.
- An integration fixture assumed `inventory_events` started empty; seed migrations
  already contain events. Corrected to compare the full before/after event snapshot,
  preserving the intended read-only assertion rather than weakening it.
- Final review identified cross-slot contextual pooling/deduplication.
  `pnpm exec vitest run tests/unit/recipe-families.test.ts -t 'keeps contextual demands'`
  failed as intended (1 failed / 13 skipped: 2 variants instead of 3). Separate
  contextual lines and slot-aware identities fixed it; the final full gates above
  ran again after the fix. D1 snapshot coherence, multiset drift and callback-cap
  regressions also remain covered.
- Existing failure-injection/KV test warnings and the pinned Wrangler v3 upgrade
  warning were nonfatal. No dependency/configuration upgrade was made.

## Database, compatibility and limitations

- **No T02 migrations.** Files 0001–0020 are unchanged; local D1 was already current.
  No remote D1, production credentials, migration or manual deployment was used.
  Target-environment apply/schema verification remains an authorized release task.
- `ALL_RECIPES`, static IDs and existing API/cooking/Week readers are unchanged.
  Replay audit: 45 shared canonical IDs, 59 shared recipes, static-only
  `gl-01`–`gl-12`; no requirement/unit drift among the shared baseline recipes.
  No automatic alias promotion/import, synchronization or silent runtime cutover.
- Legacy first/last-lot readers, dietary-string behavior and unsafe fallbacks are
  still legacy paths, not silently repaired by a library addition. Integrations
  must be reviewed in the relevant later task.
- No authoritative package-size, nutrition/allergen/price catalog, inferred safety,
  global substitute-assignment optimization, family cooking steps or persisted
  substitution registry. Current greedy one-hop allocation is deterministic, not
  an exhaustive search for every alternative feasible donor assignment.
- No browser/UI checks: no UI/API behavior changed. Local success is not hosted CI
  or deployment evidence. PayOS/payment/auth/production infrastructure is untouched.

## Next exact action

T03 is ready for a separately authorized task; do not start it as T02 follow-up.
Read the protocol and T03 packet, `RECIPE_ENGINE.md`, candidate/substitution contracts
and existing preferences/ranker consumers. First add a failing regression proving
that full quantity coverage does not pass an explicit allergen conflict or an
unprovable hard safety constraint. Define a separate eligibility result before
scores; preserve unresolved/truncated outcomes and reuse T02 arithmetic. T04–T07
remain pending their dependencies. T02 review/merge requires its own authorization.

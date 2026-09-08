# Current State — Recipe / Meal Planning Program

Verified 2026-09-08. **T03 COMPLETE — T04 READY**. T04 has not been started.

## Repository assessment and checkpoint

Implementation commit: `01f9d874c72f67dc8b414caab926aba8d4be2f68`
(`feat(recipe-ranking): add scoped deterministic ranking and feedback`).
Branch: `hoplite/stagiros-728cc726`, based on merged T02
`db09fa0c4353ddf4840e04c10b96a33240de3497`. This state-only checkpoint follows the
verified implementation and cannot name its own commit. The verified implementation
and initial handoff were published at `c5695d3913f7ec3340ce1a261fc263243a1dddbe`;
this documentation-only update follows that confirmed push. No PR or merge.

The user supplied `https://github.com/tun-vn/Frigo`; this workspace's configured
origin is `https://github.com/ganghienteck-droid/Frigo.git`. The discrepancy was
reported before implementation. The user subsequently confirmed publication to
the configured repository on 2026-09-08. The first-party publication tool confirmed
the branch at `c5695d3913f7ec3340ce1a261fc263243a1dddbe`; no remotes were changed.
Publication does not imply a merge, remote migration or deployment.

Preflight read all required specifications, rules, T01–T03 packets and T02 engine
contract; inspected Git, domain/recipe/inventory, preferences/favorites, profiles,
households, cooked history, mutable Week slots, nutrition, DB helpers and tests.
T02 code matched its checkpoint and all 106 T02 tests / 6 files passed again before
T03 edits. Historical handoff said T02 was unmerged; live Git proved it merged at
`db09fa0`. That stale documentation was corrected first; no T02 implementation
inconsistency blocked the work. Historical T02 evidence remains at
`db09fa0:docs/ai/{CURRENT_STATE,HANDOFF}.md`.

## Implemented T03

- Pure separate hard eligibility, feature extraction, normalized profile weighting,
  transparent components/contributions/reasons, completeness and stable tie-breaking.
- T02 facts are consumed, not recomputed. Small candidate additions retain existing
  family/prep metadata and private scope/fingerprint provenance. Ranking rejects
  serialized/mutated candidates or mismatched household/as-of date.
- Opaque server-provider evidence snapshots bind the exact T02 result and complete
  candidate facts. Raw JSON claiming safety/review cannot be passed to ranking.
  Providers themselves must remain trusted server code, not request-forwarding adapters.
- Hard allergies/dietary conflicts and unknown required safety evidence exclude
  before scores. Forbidden ingredients include actual replacements and conservative
  original/optional demands. Dislike is soft; never-recommend is distinct and hard.
- Nine bounded components: known quantity coverage, expiry witness shares, explicit
  preference, partial nutrition, cooking-time fit, historical novelty, exact-meal
  recency, structural shopping burden and actual substitution use. One balanced
  default profile; finite nonnegative weights normalized internally.
- Injected clock/date, linear decaying exact/family/cuisine recency, weak skipped/
  swapped feedback and durable latest likes/dislikes. Cooking never implies liking.
- Household owner defaults plus membership-scoped personal preferences. Soft user
  snapshot replaces household defaults; hard policies accumulate. Only cooked
  history is explicitly shared across members. Global preferences/favorites and
  Week settings are not silently imported.
- Reused `cooked_meals`; new append-only writer supports non-cooked feedback only.
  Context loads in one six-SELECT D1 batch with live membership. Bulk nutrition uses
  one query, current recipe versions and unambiguous serving profiles, unverified
  unless a separately trusted reviewer provides authority. No per-candidate I/O.
- Dedicated `RANKING_ENGINE.md`, ADR-013, architecture/domain and T02/T03 consumer
  updates. T04 receives utility/facts, not a weekly plan decision.

## Database and compatibility

Additive `0021_recipe_personalization.sql` creates:
- `household_ranking_preferences`: owner-written versioned preference JSON.
- `member_ranking_preferences`: household/user composite membership FK, cascading.
- `recipe_feedback_events`: scoped explicit tastes/skips/swaps; canonical target
  and replacement FKs; membership/target deletion cascades; idempotent event IDs.
- Indexes for member lookup, recent/taste feedback and household cooked history.

SQL guards require version-1 object envelopes and canonical UTC timestamps;
application Zod schemas validate complete preference/event contents. Existing
migrations 0001–0020 are byte-unchanged. Existing migration smoke/schema gates were
extended; the old newest-migration assertion now correctly expects 0021, without
weakening foundation coverage. Local D1 final bytes were freshly replayed after
preserving earlier local state at `.wrangler/state-t03-before-final-7x8GEE/state`.
No remote database, migration, deployment or catalog publication occurred.

## Final executed verification

All source/test changes preceded these final gates; later edits are documentation.
Logs are retained locally in ignored `.hoplite/artifacts/t03-checks/`.

| Exact command | Result |
| --- | --- |
| `pnpm test` | PASS — **850 tests / 56 files** |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS — application/packages/TS tests and Worker |
| `pnpm build` | PASS — Vite client and Worker TypeScript |
| `pnpm check:migrations` | PASS — `migration-smoke=ok` |
| `pnpm exec wrangler d1 migrations apply frigo-db --local` | PASS — fresh final migration chain through 0021 |
| `pnpm schema:check:local` | PASS — required ledger/tables/foundation/foreign keys |
| `git diff --check`, `git diff --cached --check` | PASS |
| Protected/source-path diff against `db09fa0` | Empty for `src`, `packages/domain`, migrations 0001–0020 |

T03 adds **76 tests / 3 files**: ranking 63, personalization persistence 7, nutrition
reader 6. The 774-test T02 baseline remains covered. Scenarios include A–W and
invariants: known partial coverage, urgent allocated fractions, unknown/past expiry,
likes/dislikes/cuisine/ingredients, hard safety precedence, unknown safety/nutrition,
recency decay/future feedback, family/cuisine variety, full/partial/unknown time,
partial nutrition and estimates, cold start, ties/bounds, immutable T02 facts,
truncation, substitutions, forged/stale evidence, and real persisted household
isolation all the way through ranking.

### Failures and repairs actually observed

- Initial `pnpm exec vitest run tests/unit/recipe-ranking.test.ts` failed collection
  because `ranking.ts` did not yet exist (1 failed suite, no tests). Do not call this
  two executed failing assertions. Both initial safety tests passed once implemented.
- Intermediate concurrent typecheck/build runs reported unfinished nutrition-row
  typing or the old `indexRankingEvidence` import during the opaque-boundary change.
  Those errors were fixed; the final complete five-gate run above passed afterward.
- Self/independent review led to stronger opaque evidence provenance and complete
  candidate binding, proportional known-partial coverage, expiry-kind shares,
  explicit history ID namespace, SQL NULL-safe JSON checks and as-of taste selection
  before latest-event reduction. Regression tests cover these corrections.
- Platform setup tools incorrectly reported no `.hoplite/settings.json` despite its
  presence. Ran its documented idempotent SQLite dependency check and
  `pnpm install --frozen-lockfile` directly; reported the platform discrepancy.
  No dependency upgrade or unrelated setup/configuration change.
- Existing expected failure-injection/KV warnings and pinned Wrangler upgrade warning
  are nonfatal; final commands passed. No hosted CI success is inferred.

## Genuine remaining limitations

- No comprehensive safe-food review/catalog was invented. Active hard constraints
  can legitimately yield no recommendations without trusted exact-dish evidence.
- Expiry follows T02's ID-order witness, not FEFO or actual/cross-meal consumption.
- Static-only recipe feedback needs reviewed D1 registration; family variant history
  and automatic Week feedback capture remain future integration work.
- Legacy missing prep time and unsupported/ambiguous nutrition remain unknown;
  D1 observations alone cannot satisfy reviewed hard nutrient constraints.
- Current preference snapshots are not historical versions. Household timezone,
  private recipe publication and legacy runtime ranker issues remain as documented.
- No UI changes, so browser/preview verification was NOT RUN. Remote D1, hosted CI,
  production integrations and deployment were NOT RUN/not authorized.

## Next exact action

T03 is published on `hoplite/stagiros-728cc726` in `ganghienteck-droid/Frigo`.
Create/link a PR if requested and subscribe to auto-fix if creating one; no merge
or deployment is authorized. T04 is ready for a separately authorized task, beginning
with its packet and the T02/T03 contracts. Do not start T04 in this publication task.

### Publication-only follow-up verification

No implementation, tests or migration bytes changed from the verified checkpoint.
The 850-test result and full gates above are the prior executed results, not new
test runs. This follow-up inspected clean Git status/history/diff and remote branch
state, confirmed first-party publication, and ran diff checks on the documentation
update. A shell remote-discovery command was denied before execution by source-control
policy; repository-bound branch discovery and publication tools succeeded instead.

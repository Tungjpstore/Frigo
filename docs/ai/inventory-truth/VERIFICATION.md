# T08 verification evidence

## 2026-09-09 — initial checkpoint

SHA: d1b06732f8a80db4e77986df31ff28d9f04641fa

- PASS: Git status clean before edits; main/HEAD baseline inspected; canonical
  local branch created; inherited main upstream removed.
- PASS: trusted `source_control_fetch_git_refs` for explicit `main`.
- BLOCKED: shell `git fetch origin main --prune` denied by platform policy;
  the rejected command did not perform checkout or file edits.
- Focused tests/full suite/lint/typecheck/build/migration replay: NOT RUN.
- FULL SUITE NOT RUN IN THIS SESSION (initial checkpoint only).
- No remote database, deploy or payment operation performed.

Historical T01–T07 evidence in parent documents is not a T08 test result.

## 2026-09-09 — verified implementation checkpoint

SHA: `dd2ecc6f7066250dfdc5214a3d6c356e1479b61e`.
Base: `d1b06732f8a80db4e77986df31ff28d9f04641fa`.
Environment: Node 24.19.0, repository pnpm lockfile, Wrangler 3.114.17,
SQLite/node:sqlite and sandbox-local D1. No remote database or deployed app used.

| Exact command | Result |
| --- | --- |
| `pnpm exec vitest run tests/unit/inventory-truth.test.ts tests/integration/inventory-truth.test.ts` | PASS, 130 tests / 2 files (76 unit + 54 integration); final run 23:36 UTC |
| `pnpm test` | PASS, 1,617 tests / 89 files; final run started 23:35:04 UTC, 83.65s |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS, app + Worker including TS tests |
| `pnpm check:migrations` | PASS, migration-smoke=ok through 0023 |
| `pnpm wrangler d1 migrations apply frigo-db --local` | PASS, 23/23 migrations applied to private sandbox D1 |
| `pnpm schema:check:local` | PASS, new migration/tables/columns and FK gate |
| `pnpm build` | PASS, Vite production build + Worker TypeScript; no deployment |
| `git diff --check` | PASS |
| `git diff d1b06732f8a80db4e77986df31ff28d9f04641fa HEAD --check` | PASS |

Local complete output logs (git-ignored, not a cross-account dependency):
`.hoplite/artifacts/t08/full-tests-final.log`, `build-final.log`.
The commands, test source and committed SHA are the reproducible evidence.

### Migration / backfill / query-plan evidence

Integration suite replays all migrations into a fresh FK-enabled SQLite DB, proves
no automatic lot cutover, then separately upgrades a populated 0022 fixture.
Eight seeded inventory rows produce exactly eight synthetic lots; second execution
inserts zero. Original inventory/events/ingredients compare unchanged. Concurrent
backfill results are 8+0 inserts. Changes to a source row with or without a version
bump roll back all lot/default inserts. Unknown ingredient, zero stock, custom
default location IDs, valid/invalid/estimated expiry, kg/l conversion, stale snapshots,
existing guest transfer and household cascade are covered. Raw SQL rejects foreign
ingredient/household/location, negative/fractional/unsafe milli quantity, duplicate
source, contradictory expiry and invalid currency/minor-digit/amount combinations.

`EXPLAIN QUERY PLAN` assertions confirm the named household/location, legacy source,
ingredient and default-location indexes serve their documented equality queries.
No speculative FEFO or event index was added. Migration is ledger-applied once;
the explicitly invoked data backfill, not arbitrary schema re-execution, is idempotent.

### Existing behavior regression

Full suite includes inventory reads/manual idempotency, command-route integrity,
scan confirmation/queue/quota, Week shopping import, cooking allocation/completion,
planner snapshot/HTTP and guest/auth persistence tests. All pass unchanged except
two latest-migration filename assertions updated from 0022 to 0023. Those assertions
still require the exact latest migration; no behavioral coverage was weakened.
No UI changes; no new browser appearance/interaction claim is made.

### Failures investigated and corrected

1. Initial migration smoke failed `no such table: assert_one`: newly added checks
   preceded the assertion table. Moved after its creation; subsequent smoke PASS.
2. First integration run: 46 failed / 8 passed because a WIP domain contract lacked
   legacyVersion (SQLite bind parameter 40 undefined). A parallel typecheck reported
   the same missing field. Completed the contract and decoder; 54/54 integration PASS.
3. First full run: 1 failed / 1,616 passed. Preview fixture still expected latest
   migration 0022. Updated to actual 0023, then reran the ENTIRE suite: 1,617 PASS.
4. Shell fetch and canonical publication were rejected by platform policy, not by
   repository tests. Fetch works through the trusted broker; publication remains blocked.

### Publication / limits / exclusions

Initial canonical publication attempt targeted ONLY
`feature/t08-inventory-truth-foundation`, source
`43718c2f64a0af86ceaa89244568c5f9fa1a1865`, expected remote head NULL.
Broker denied it because the branch is outside the thread/stack/linked-open-PR head
authority. No alternate push or PR was attempted; platform feedback was submitted.
Code and final handoff are local only until that boundary is resolved.

Last explicit main fetch: `d1b06732f8a80db4e77986df31ff28d9f04641fa`, unchanged from
base. No migration numbering collision found. No merge/rebase was performed.
Money supports VND/JPY/USD/EUR only, with NULL remaining unknown. Quantity scale
is 1000 of canonical unit with safe-integer bound; exact conversion rejects drift,
sub-milli precision and overflow. Projection separately retains contextual/unmapped
lots and fails if its Number compatibility total loses exact decimal value.
Legacy synthetic subset parity is snapshot equality, not live authoritative stock;
nonlegacy sources are invariant-checked but not counted as synthetic backfill.

Main/production/staging/remote D1/secrets/flags/PayOS implementation untouched.
Clean local migration replay necessarily includes the existing unchanged 0018 file;
no payment code or migration was edited and no real payment operation occurred.
T09–T12 are not implemented. T09 must resolve command/event authority, live dual-write,
ownership transfer, existing drift and representability policy before any consumer cutover.

# Frigo current state — existing release PR #8

## Current task

**T01–T07 ENGINEERING COMPLETE.** T07's accepted non-blocking follow-ups remain.
**RELEASE INTEGRATION IN PROGRESS — publication blocked.**
**PRODUCTION DEPLOYMENT NOT PERFORMED.**

Continue existing Draft PR [#8](https://github.com/vn-2c/Frigo/pull/8), branch
`hoplite/kirrha-5f4057f0`; do not recreate integration or rewrite history.
`RELEASE_CANDIDATE.md` is the current release receipt/runbook. Historical T07
implementation and phase evidence remain in `T07_VERIFICATION.md`, H1–H6 receipts
and `PRODUCTION_READINESS.md`; their old hosted-CI blocker is superseded below.

## Frozen release identity

- Main remains `db09fa0c4353ddf4840e04c10b96a33240de3497`, unchanged from PR creation.
- Release/T07 source: `0b20061e7dc7405df68b18a18da4166e09494ecd`.
- Last application/test commit: `f9d2ff871da155ba7f1aaedd3112a5ed6ea8d2c0`.
- Full T01–T07 ancestry, including `006742b`, exact recovery `f391804`, and T06B
  `0fc78a4`/`6d4e873`, remains intact. No squash/rebase/cherry-pick/reset.
- Existing release branch was checked out from the fresh workspace's alternate
  local name at the same SHA. No new release branch or remote change.
- Provider currently identifies the existing repository/PR as `vn-2c/Frigo`.

Main and release refs were fetched through the explicit-ref trusted broker and
matched expected SHAs. No topology reintegration was necessary. Source-equivalence
comparison from `f9d2ff8` passed; this continuation changes **documentation only**.

## Fresh release verification — 2026-09-09

| Gate | Actual result |
| --- | --- |
| Frozen dependency install | PASS; pnpm 14.1 s, lockfile unchanged |
| `pnpm test` | **1,487 tests / 87 files PASS**, 0 failures; Vitest 140.36 s, wall 141.834 s |
| Focused T02–T07 suites | **819 tests / 40 files PASS**, 0 failures; Vitest 56.48 s, wall 59.555 s |
| Payment-adjacent entitlement/quota/config/limiter suites | **82 tests / 7 files PASS**, 0 failures; Vitest 9.83 s, wall 13.006 s |
| `pnpm lint` / `pnpm typecheck` / `pnpm build` | PASS; wall 10.682 / 33.524 / 22.997 s |
| Migration smoke / clean local D1 / schema | PASS; 22/22 migrations; wall 0.666 / 11.844 / 2.642 s |
| Actual-main 0020 → 0022 upgrade | PASS; 776 rows / 58 old tables unchanged; apply 3.019 s, upgraded schema gate 2.587 s |
| Foundation/preflight regressions | PASS 22/2; Vitest 3.16 s, wall 4.626 s |
| Existing managed browser matrix | PASS; 264 assertions / 36 phases, all 121 commands; en/vi × 375/390/1280; 485.976 s; zero failures/page errors |
| Hosted release-source CI | **SUCCESS**, run `34387688066`, job `102587994085`, exact `0b20061`, completed 18:14:28Z |

All local tests were freshly executed, not copied from the T07 audit. Counts overlap.
Supplemental direct-PRAGMA Wrangler inspection returned `SQLITE_AUTH`; the supported
FK query and read-only SQLite integrity check passed. Exact commands, scope and
documentation-head CI limitation belong in
`RELEASE_CANDIDATE.md`. No application/test/config fix or weakened assertion.

## Feature flags / readiness / protected areas

Backend, UI and AI flags remain literal-true opt-in. Checked-in production defaults
are off; live deployed values were not inspected. Only the existing isolated
preview enables backend/UI, with deterministic AI fallback. Legacy Week and real
inventory commands remain intact. Planned != consumed; shopping != purchased.

D1 through 0022 and valid production bindings/auth/origin remain operator gates.
No reviewed production purchase-catalog adapter or safety registry is provided;
unknown prices/nutrition/safety remain explicit. KV counters are non-atomic;
concurrent initial requests may duplicate CPU; fixed-offset time, clipped optimizer
quality, uncancelled native AI and large-catalog/network limits remain documented.

**PayOS/payment code untouched by release integration.** Main-to-source protected
paths and shared middleware were reviewed. No dedicated PayOS regression suite was
found; adjacent test success is not live payment certification. No real payments,
remote migrations, production flag enablement, deployment or unrelated auth change.

## Environment and next action

The platform missed tracked `.hoplite/settings.json` and rejected managed setup's
lifecycle claim. Exact existing setup/run commands were mirrored into overrides;
unchanged setup ran successfully via shell and managed preview started. Reported
platform limitation, not an application defect; no repository config change.

All source gates are green. Local docs commit
`e060164650969faefeb7ebb808ad5cbab32c4980` could not publish:
**`Cannot publish the configured base branch hoplite/kirrha-5f4057f0`**.
The linked PR head is also this thread's protected base. No bypass or replacement
branch/PR was attempted; platform issue reported. Remote PR remains draft at
`0b20061`, existing CI green; new documentation-head CI cannot run without a push.

An authorized operator/platform owner must reconcile publication authority for the
existing release head. Then publish preserved local docs commits, inspect new-head
CI and record readiness. **RELEASE INTEGRATION NOT READY** until those two gates.
Do not redo integration or already-green source verification unless source/main
changes. Final **normal merge** remains an explicit operator action.
Before merging, review existing main-push automatic staging behavior. Deployment
requires separate exact-main push CI, schema/data readiness and operator approval.

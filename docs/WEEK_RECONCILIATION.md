# Week v1/v2 reconciliation

`d1-week-reconcile.sh` runs a read-only D1 query and computes deterministic
SHA-256 checksums locally. It never applies migrations, writes rows, or
deploys a Worker.

```bash
pnpm week:reconcile:local
pnpm week:reconcile:remote
pnpm week:reconcile:remote -- --json
pnpm week:reconcile:remote -- --strict
```

Set `D1_DATABASE` to inspect another database. The report includes per-plan
row counts, orphan IDs on either side, content mismatches, and canonical
checksums. Canonical slots/shopping items prefer their persisted snapshot JSON
and fall back to relational columns, so richer planner metadata is included
when available. Day-of-week values are normalized to ISO `1..7` (Sunday `7`).
The gate also rejects vacuous parity: a `READY`, `ACTIVE`, or `COMPLETED` plan
with no day rows is reported as an incomplete materialized projection even if
both v1 and v2 are equally empty.

The default command is report-only and exits successfully even when parity is
not achieved. `--strict` makes any mismatch a non-zero result for release or
canary gates. Do not enable `WEEK_SCHEMA_MODE=dual` until a strict production
reconciliation reports 100% parity for the intended plan population. Once
production is in `dual`, keep this gate green on every Week-affecting release;
the read path remains v1 until a separate v2-read decision.

For the final pre-deployment gate before a dual-write canary, run:

```bash
CHECK_REMOTE_SCHEMA=1 CHECK_WEEK_PARITY_REMOTE=1 pnpm check
```

Keep `CHECK_WEEK_PARITY_REMOTE` disabled for ordinary legacy releases because
historical invalid plans should block a Week cutover, not unrelated hotfixes.

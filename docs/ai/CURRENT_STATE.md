# Frigo current state — T07 hardening in progress

## Current task

**T01–T05 COMPLETE. T06A COMPLETE. T06B COMPLETE. T07 IN PROGRESS.**
The user authorized the writable continuation on 2026-09-09. The prior publication
blocker is resolved; this is not an architectural repository issue.

- Original T07 branch: `hoplite/lipara-d81160ee`.
- Published continuation checkpoint: `006742bc179d58aae53106c88aff8a2667dbd1ca`.
- Writable continuation: `hoplite/prokonnesos-74e71894`.
- Exact recovery documentation `f39180421f12ff68751dba7898aa39535b2d3a95` was
  preserved by fast-forward and successfully published on the continuation branch.
- T06B base `6d4e873b180e46edcaf8088f848b3afab853bc66` and verified application
  `0fc78a4fdc624973413259c048e65ed585fa2b8e` remain ancestors. No reset or restart.

## Phase evidence

| Phase | Current evidence | Status |
| --- | --- | --- |
| H1 security/trust/tenancy | 51 new actual-auth HTTP cases; route/repository ownership matrix; related boundary 125/4 and CSRF/CORS 87/2 PASS | Planner boundary audited; broader rendering/log review continues H5/H6 |
| H2 abuse | Account/path fan-out reproduced; aggregate fix being verified | In progress |
| H3 persistence | Controlled concurrency and query-plan review | In progress |
| H4 domain | Exact arithmetic, bounds, unknown/proof semantics | In progress |
| H5 frontend/AI | Mounted race and grounded AI review | In progress |
| H6 operations | Observations, failure/privacy checks and rollout report | Pending |

H1 adds `tests/integration/t07-security.test.ts` and `T07_H1_SECURITY.md` only.
No H1 security bug was reproduced, so no speculative security change was made.
Parallel later-phase work may exist uncommitted; phase commits stage only their
own reviewed files. Final application source has not been frozen.

## Verification boundaries

Fresh recovery on unchanged `006742b`: frozen pnpm install PASS; `pnpm test`
**1,390 tests / 79 files PASS** (57.44 s); focused limiter/planner HTTP
**74 tests / 3 files PASS** (5.33 s). These checks are not being needlessly rerun.
H1 exact commands and scoped limits are in `T07_H1_SECURITY.md`.
Final source-freeze gates, clean D1/schema, full browser matrix and hosted CI
are still pending; no production-readiness conclusion is claimed.

## Preserved system and compatibility

T06B's private current-plan discovery, strict intent-only API, revision CAS,
server-loaded T02–T05 snapshots, explicit uncertainty/proof DTOs, private query
keys/session generations, exact money display and grounded on-demand AI remain
the baseline. Canonical contracts are in `API_INTEGRATION.md`,
`FRONTEND_MEAL_PLANNER.md`, `AI_LAYER.md` and the four engine guides.
Historical completed frontend verification is in `T06B_VERIFICATION.md` and
`T06B_E2E.md`; the original T07 receipt is `T07_BASELINE.md`.

Planner/UI/AI flags remain literal-true opt-in. Legacy Week and inventory commands
remain intact. Planned consumption is not actual consumption; shopping is not a
purchase. No remote D1, deployment, production flag or payment work is authorized.
**PayOS/payment code untouched.**

## Next action

Publish H1, then finish/publish the reproduced H2 aggregate-budget fix and its
explicit approximate-KV guarantee. Continue H3–H6, freeze source, and run all final
gates. Follow `T07_WIP_HANDOFF.md`; do not return to the original branch to publish.

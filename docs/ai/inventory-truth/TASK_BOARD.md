# T08 task board

- [x] T08A Audit — dependency map/legacy semantics in MASTER_CONTEXT; SQL query-plan tests.
- [x] T08B Domain Contracts — e6ba715; 76 focused unit tests PASS.
- [x] T08C Persistence — cdffb42; 0023 FK/check/indexes; 23-migration replay/local D1 PASS.
- [x] T08D Legacy Backfill — dd2ecc6; retry, concurrency, stale-source rollback,
  populated upgrade, ownership transfer and preservation tests PASS.
- [x] T08E Projection/Parity — 10+6 eggs=16 and corruption diagnostics PASS.
- [ ] T08F Verification/Handoff — publication gate remains blocked.
  - [x] Focused: 130 tests / 2 files PASS.
  - [x] Full: 1,617 tests / 89 files PASS.
  - [x] Lint, typecheck, build, migration smoke, local D1 apply/schema, diff checks PASS.
  - [x] Code committed; repository handoff/parent docs updated in final docs checkpoint.
  - [ ] Canonical branch pushed via authorized path (broker denial recorded).
  - [ ] Final post-publication clean-tree receipt and T08_VERIFICATION.md / COMPLETE.

No completion tick without evidence in VERIFICATION.md. T09–T12 are not started.

# Inventory Truth session log (append-only)

## 2026-09-09 — session start

Started from: hoplite/xanthos-7d942897@d1b06732f8a80db4e77986df31ff28d9f04641fa.
User confirmed repository vn-2c/Frigo after initial repository-owner mismatch.
Inspected: Git, required docs/ai protocol/architecture/domain/decisions/release
handoff, migration chain through 0022, package/test tooling and quantity engine.
Changed: created canonical local branch and these six handoff documents.
Decisions: DEC-001; existing runtime remains authoritative, no main upstream.
Bugs/blockers: shell fetch policy denial; broker fetch works. Canonical publish
authority not confirmed. No implementation defects diagnosed yet.
Tests: none yet; see VERIFICATION.md.
Commits: initial docs checkpoint pending.
Remaining work: T08A–F.
Exact next action: complete audit/design before code and migrations.
Checkpoint at: feature/t08-inventory-truth-foundation@d1b06732f8a80db4e77986df31ff28d9f04641fa
(before initial documentation commit; a later session-end entry will name code SHA).

## 2026-09-09 — implementation and local-verification checkpoint

Started from: feature/t08-inventory-truth-foundation@43718c2f64a0af86ceaa89244568c5f9fa1a1865.
Inspected: all relevant inventory readers/writers, events, CAS/idempotency, guest
transfer, scan/receipt metadata, quantity/money/expiry contracts, migrations and
regression tests. Completed dependency/index map; no production stream interference.
Changed: domain inventory-truth leaf with projection/parity; 0023 location/lot
schema; explicit guarded repository backfill; 130 focused tests; migration/schema
gates and two exact latest-migration assertions; six handoff files, task packet,
parent CURRENT_STATE/TASK_BOARD/HANDOFF. No API, frontend, legacy writer or auth edit.
Decisions: DEC-002–005; bounded exact milli representation, unknown raw evidence,
insert-only snapshot backfill, separate legacyVersion, canonical-only publication.
Bugs: assertion-table ordering, temporary missing domain legacyVersion, old latest
migration expectation; all corrected and rerun. See VERIFICATION.md for failures.
Tests: focused 130/130, full 1,617/1,617 (89 files), lint, typecheck, build,
23-migration smoke/local D1 apply/gate, source/base diff check PASS.
Commits:
- 43718c2 docs(t08): add isolated inventory truth working context
- e6ba715 feat(t08): add lot contracts and exact projection parity
- cdffb42 feat(t08): add constrained lot and storage persistence
- dd2ecc6 feat(t08): add guarded idempotent legacy backfill
- Following docs checkpoint: docs(t08): record verified foundation and publication blocker
Main divergence: NO; last fetched origin/main remains base d1b0673. No numbering
collision; integration/renumbering intentionally not attempted.
Remaining work: canonical publication and post-publication COMPLETE receipt/report.
Exact next action: obtain authorized canonical-head publication, inspect exact
remote head, push docs-inclusive tip with trusted broker; never push another branch.
Ended code at: feature/t08-inventory-truth-foundation@dd2ecc6f7066250dfdc5214a3d6c356e1479b61e.
Final branch tip is the subsequent docs-only checkpoint (`git rev-parse HEAD`);
self-referential commit hash cannot be embedded in its own contents.
Status: IN_PROGRESS, local gates passed, publication BLOCKED. Main, production,
staging, remote D1 and PayOS remain untouched. No T09 started.

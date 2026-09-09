# Recipe / Meal Planning Task Board

Verified 2026-09-09. **T06 IN PROGRESS** after explicit authorization. Read
`AGENT_RULES.md` and the required current documents before editing.

| Task | Status | Dependencies | Verified checkpoint |
| --- | --- | --- | --- |
| T01 — Domain & Data Foundation | **COMPLETE** | — | Additive 0019/0020, canonical identity/version/provenance and development protocol. |
| T02 — Recipe Engine | **COMPLETE** | T01 | Merged `db09fa0`; exact lot-aware candidates, scaling, approved substitutions, bounded families. |
| T03 — Ranking & Personalization | **COMPLETE** | T02 | Immutable `3592de9`; scoped deterministic eligibility/ranking, feedback and 0021 persistence. |
| T04 — Weekly Meal Planner | **COMPLETE** | T02, T03 | Hardened `d7dff8f`, final handoff `ebd538b`; fresh preflight 924 tests / 61 files passed. |
| T05 — Budget / Shopping / Waste Optimizer | **COMPLETE** | T04 | Published `4f3f539`; fixed-plan deficits, trusted packages/prices, bounded optimization, exact budget proof, surplus/risk, 153 new tests. |
| T06 — AI Layer + API + Frontend Integration | **IN PROGRESS** | T04, T05 | T05 base `899b6d7`; fresh baseline 1077 tests / 66 files PASS. ADR-016 defines authorized integration; implementation and verification pending. |
| T07 — Hardening / Tests / Final Architecture Review | BLOCKED BY T06 | T01–T06 | Final integrated safety, integrity, concurrency and end-to-end review. |

### T06 frontend checkpoint

The additive `/planner` client/UI and focused tests are in place. It uses
server-only authenticated planner APIs, scoped query keys and explicit stale,
partial, unknown-price and no-reviewed-catalog states; legacy Week stays default.
Budget does not trigger unsupported automatic replanning, taste feedback is
separate from skip annotation, and retries reuse the client idempotency intent.
Focused UI/client/T05-DTO tests: **35 / 6 PASS**; scoped lint and `pnpm build:web`
PASS. Full typecheck is pending the concurrently in-progress Worker service; browser
verification remains with the parent agent.

## Current checkpoint

Dedicated branch `hoplite/datala-8b986478`, configured repository `ars-vn/Frigo`.
User-supplied `tun-vn/Frigo` redirects there. Clean immutable T04 base:
`ebd538b4a57c2af85ad28a34c54f762093bc2403`. New commits only:
- `f28ab54d8084ec737382cb11a00b49275930fa3b` — preflight/scope checkpoint.
- `4f3f5394772e0be57108b179775034dbb64e5073` — verified and published T05 implementation.
- Following documentation checkpoint — records actual verification and readiness;
  enumerate its own SHA with `git log --reverse --format='%H %s' ebd538b..HEAD`.

No T01–T04 history or implementation was rewritten. No PR, merge, deployment or
remote D1 operation. `SHOPPING_OPTIMIZER.md` and ADR-015 define the accepted T05
contract. The detailed no-replanning authorization supersedes the original T05
packet's proposed feedback loop; T05 emits feedback but never invokes T04.

## Final executed verification

- `pnpm test`: **1077 tests / 66 files PASS**; T05 adds **153 / 5**.
- Focused T02–T05: **403 / 18 PASS**. T05-only: **153 / 5 PASS**.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm check:migrations`: **PASS**.
- Existing local D1 migration apply and `pnpm schema:check:local`: **PASS**.
- `git diff --check`, `git diff --cached --check`: **PASS**.
- Protected paths and dependency implementation diff against `ebd538b`: **empty**.
- Independent review: three reproduced defects corrected; re-review found no blockers.
  Initial review regression run **3 failed / 1 file**; final hardening suite **17 PASS**.
- Stress: 32 options / 2e9 g, exactly 200 states per repeated deterministic run,
  sufficient best-known candidate and visible truncation. Ten exhaustive small
  oracle cases verify optimal cost/surplus/count. No timing claims.

Exact commands, logs, setup/source-control limitations and all results are in
CURRENT_STATE/HANDOFF. UI/preview and hosted CI were **NOT RUN** because this is a
pure generated-only subsystem change with no PR. No new schema was needed.

## Next action / operating rules

T06 is READY, not authorized by this completion. On a separate request, read its
packet plus `WEEKLY_PLANNER.md` and `SHOPPING_OPTIMIZER.md`; establish authorized
preload, reviewed catalog data and shadow integration before acceptance/cutover.
T06 must not recompute package combinations or treat client prices as trusted.

Keep money exact, unknown distinct from zero, surplus distinct from certain waste,
and T04 completeness separate from T05 proof. Partial-horizon purchase allocation,
live retail data/FX/bundles and global waste optimality are explicitly not claimed.

PayOS/payments, unrelated auth/infrastructure and legacy Week/inventory command
boundaries remain protected. Do not silently change meals, stock or runtime readers.
Update state/board/handoff with exact executed checks at each future checkpoint.
# Active roadmap override — T06 split

| Task | Current status |
| --- | --- |
| T01 | COMPLETE |
| T02 | COMPLETE |
| T03 | COMPLETE |
| T04 | COMPLETE |
| T05 | COMPLETE — `899b6d7` |
| T06A Backend/API/Trust | IN PROGRESS — Case C recovery of `84251cc` |
| T06B Frontend/UX/AI presentation | BLOCKED BY T06A |
| T07 | BLOCKED BY T06B |

The original combined T06 packet/history above is superseded by the explicit
T06A-only authorization. Current recovery evidence: `T06A_HANDOFF.md`.

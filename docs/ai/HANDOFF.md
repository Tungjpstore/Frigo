# Frigo AI Handoff

## Current Task
T07 — final hardening, continuing the published interruption checkpoint.

## Task Status
**T01–T05 COMPLETE. T06A COMPLETE. T06B COMPLETE. T07 IN PROGRESS.**
H1 `65c1367`, H2 `55020bc`, H3 `a19063b`, H4 `865ee91`, H5 `d579798` are published.
H6 operational evidence is ready; final source-freeze verification continues.

## Repository / Branch Topology
Current repository-bound tools identify `fri-go/Frigo`; historical `sex-vn/Frigo`
checkpoint objects are present. No remote was changed.
Original T07 branch: `hoplite/lipara-d81160ee`.
Continuation checkpoint: **`006742bc179d58aae53106c88aff8a2667dbd1ca`**.
Writable continuation branch: **`hoplite/prokonnesos-74e71894`**.
The user explicitly authorized this topology because of Hoplite publisher binding;
it is not a repository architecture problem. Never publish back to the old branch.

## Last Verified Commit
Exact recovery checkpoint **`f39180421f12ff68751dba7898aa39535b2d3a95`** was safely
fast-forwarded onto and successfully published on the writable branch. Ancestry
through `006742b`, `0f6c382` and T06B base `6d4e873` passed; no source divergence at
recovery. The last historical verified T06B application remains `0fc78a4`.
There is no final T07 application freeze yet.

## Implemented / Audited
H1 adds 51 adversarial actual-cookie-authenticated planner HTTP cases and a complete
route/repository ownership matrix in `T07_H1_SECURITY.md`. Cross-household and
same-household noncreator IDs are denied, membership revocation is enforced,
trusted snapshot/price/substitution/mass-assignment claims are rejected, and
persisted hard restrictions beat soft preference. No H1 security defect reproduced;
no speculative source fix. Rendering/log breadth continues in H5/H6.

## In Progress
H2 aggregate account budget is published `55020bc` (95/6 focused PASS and targeted ESLint);
see `T07_H2_ABUSE.md` for pre-fix failures, real-Hono error proof and non-atomic KV
characterization. Next checkpoint preserves the fix and ADR-019. H3 concurrency/persistence,
H4 exact-domain contracts, H5 mounted frontend/AI/flags, H6 operational observations.
Parallel source/test work is staged only into its own reviewed phase checkpoint.

H3 confirmed a post-CAS reread could return a later writer's revision. The update
now returns its own atomic `RETURNING` row, retaining all owner/revision predicates.
Six new controlled-race cases and 68/6 parent related tests pass. Local migration/schema
and versioned `scripts/t07-query-plans.mjs` checks pass; no index/migration added.
Assembled typecheck passes after correcting H2's test-only array inference.

## Database / Migration Changes
None in H1. No remote database operation. Existing local SQLite-backed tests replay
0001–0022; final clean Wrangler D1 apply/schema checks remain pending.

## Tests / Verification
Fresh recovery, not final T07: frozen install PASS, full **1,390/79** PASS (57.44 s),
requested limiter/planner HTTP **74/3** PASS (5.33 s).
H1: new suite **51/1**, related planner HTTP/presentation/snapshot **125/4**,
existing CSRF/CORS **87/2**, targeted ESLint PASS. Exact executed commands,
intermediate assertion correction and limitations are in `T07_H1_SECURITY.md`.
Final full gates/browser/hosted CI have not been completed. Counts overlap.

## Environment / Preview
Managed preview uses the existing isolated `node scripts/security-preview.mjs`.
Project settings discovery incorrectly reported the tracked `.hoplite/settings.json`
missing; exact tracked setup/run commands were mirrored as overrides and the
platform issue reported. No production settings or repository scripts changed.
The preview is real Vite/Worker with private in-memory SQLite and synthetic cookie
sessions; external backend fetch is blocked. Final browser verification is pending.

## Feature Flags / Legacy Coexistence
Planner and AI remain opt-in on literal `true`; legacy Week, shopping and real
inventory commands are preserved. No deployment/production cutover is implied.

## Protected Areas
**PayOS/payment code untouched.** No billing/checkout/subscription/webhook,
unrelated auth or production infrastructure change. Preserve unknown != zero,
best known != proven optimal, planned != actual consumption, and intent != trust.

## Next Exact Action
Publish H6 evidence, freeze exact application/test source, then execute full final
gates and six-combination browser matrix. Do not claim earlier phase tests as
frozen-source results. Current exact progress and preserved historical recovery:
`T07_WIP_HANDOFF.md`. Do not restart T07, reset history or request branch approval
again unless ancestry genuinely fails.

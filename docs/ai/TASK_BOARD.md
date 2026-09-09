# Frigo task board

| Task | Status | Evidence / dependency |
| --- | --- | --- |
| T01 Domain/data foundation | COMPLETE | Preserved published foundation and hardening |
| T02 Recipe engine | COMPLETE | Preserved `0051276` / `ef13acd` |
| T03 Ranking/personalization | COMPLETE | Preserved `01f9d87` / `3592de9` |
| T04 Weekly planner | COMPLETE | Preserved hardened `ebd538b` |
| T05 Shopping/budget/waste | COMPLETE | `4f3f539` / `899b6d7` |
| T06A Backend/API/trust/persistence | COMPLETE | Published `9f420c0` / `ca60ced` / `c46330c`; 1136 tests verified |
| T06B Frontend/UX/AI presentation/E2E | IN PROGRESS | Authorized attached task; clean base `9ec7b68`, ADR-018; checkpoints/browser gates pending |
| T07 Final hardening | BLOCKED BY T06B | Do not start implicitly |

## Task split and recovery

The explicit T06A request supersedes the combined T06 packet's frontend/AI scope.
`84251cc` exists but was incomplete/unbuildable: references without new source files.
Case C recovery preserved history, removed dangling hooks/dead navigation and retained
nonblocking frontend query/layout material. No unpublished workspace was reconstructed.
The authoritative T05 checkpoint remains `899b6d7`, an ancestor of the current branch.

## Current checkpoint

Branch `hoplite/leukas-32474504`, authorized `arsvn-vn/Frigo`. Recovery commit
`9f420c05cf3adf48825f2645bcdc5accf36ac4b4` is published with typecheck/build and
1077 tests / 66 files passing. Backend adds strict DTOs, a coherent authorized D1
snapshot, current-plan CAS storage, thin generate/get/regenerate/swap/shopping/
feedback routes, existing rate limits and exact uncertainty-safe mapping.

Backend initial focused suite: 51 tests / 5 files pass. Initial full suite
1127 passed / 1 failed due to the migration-head assertion; expected head updated
from 0021 to newly appended 0022. Full rerun: **1128 tests / 71 files PASS**.
Final hardened `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` PASS:
**1136 tests / 71 files** (42 HTTP scenarios). `pnpm check:migrations`, local D1 apply
and local schema gate PASS. Independent follow-up review: **48 tests / 2 files PASS**;
atomic stale-feedback/replay fix verified. Malformed budget strings return 422.
Current-time history freshness retains new-event detection. Final test-only TS2571
was fixed without weakening assertions; all gates reran successfully.

## Next exact action

Tested hardening `c46330c61bc1bf3685508716a8ab10d72ec30b1e` is published and recorded
in `T06A_HANDOFF.md`. Separately authorize T06B to start from frontend-safe schemas
and `API_INTEGRATION.md`, retaining legacy Week as default.
No payment, real inventory mutation, implicit purchase, AI authority or production
configuration cutover is part of this task.

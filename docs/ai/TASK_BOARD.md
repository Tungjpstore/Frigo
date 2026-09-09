# Frigo task board

| Task | Status | Evidence / dependency |
| --- | --- | --- |
| T01 Domain/data foundation | COMPLETE | Preserved published foundation and hardening |
| T02 Recipe engine | COMPLETE | Preserved `0051276` / `ef13acd` |
| T03 Ranking/personalization | COMPLETE | Preserved `01f9d87` / `3592de9` |
| T04 Weekly planner | COMPLETE | Preserved hardened `ebd538b` |
| T05 Shopping/budget/waste | COMPLETE | `4f3f539` / `899b6d7` |
| T06A Backend/API/trust/persistence | IN PROGRESS | Recovery published `9f420c0`; backend checkpoint and review |
| T06B Frontend/UX/AI presentation/E2E | BLOCKED BY T06A | Use `API_INTEGRATION.md` after backend verification |
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

Backend typecheck/lint/build and 51 focused tests / 5 files pass. Initial full suite
1127 passed / 1 failed due to the migration-head assertion; expected head updated
from 0021 to newly appended 0022. Full rerun: **1128 tests / 71 files PASS**.
Migration smoke, local D1 apply and local schema gate PASS. Independent review and
final handoff remain; do not mark COMPLETE before review.

## Next exact action

Complete/publish backend checkpoint and final review. T06B should then start from
frontend-safe schemas and `API_INTEGRATION.md`, retaining legacy Week as default.
No payment, real inventory mutation, implicit purchase, AI authority or production
configuration cutover is part of this task.

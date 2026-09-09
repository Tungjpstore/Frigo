# Frigo current state — release publication recovery

## Current task

**T01–T07 COMPLETE. ENGINEERING RELEASE VERIFICATION COMPLETE.**
**RELEASE INTEGRATION VERIFIED.**
**RELEASE PUBLICATION COMPLETE. RELEASE CANDIDATE READY FOR MAIN MERGE.**
Final normal merge requires user permission and green checks on the actual PR head.
**PRODUCTION DEPLOYMENT NOT PERFORMED.**
Production-local reconciliation: **NOT STARTED**. This is not T08 or another
hardening/integration pass. Detailed preserved evidence: `RELEASE_CANDIDATE.md`.

## Immutable source and recovery

- Repository: `vn-2c/Frigo`; no remote changed.
- Main: `db09fa0c4353ddf4840e04c10b96a33240de3497`, unchanged.
- Verified application/release: `0b20061e7dc7405df68b18a18da4166e09494ecd`.
- Last application/test commit: `f9d2ff871da155ba7f1aaedd3112a5ed6ea8d2c0`.
- Original release branch/PR: `hoplite/kirrha-5f4057f0`, non-draft #8.
- Writable continuation: `hoplite/koroneia-355b17d0`, provisioned for this thread.
- Recovered docs checkpoint `7b22aaf4ba44c9a059fbf0000f242ed35ef4c616` is available
  and successfully published to the continuation through the trusted broker.

The original head is this thread's protected configured base. Its old push and
PR-link errors are recorded in the release receipt. The user authorized a writable
fallback; existing docs commits were preserved by fast-forward, not reconstructed.
Complete T01–T07 lineage and `0b20061` remain ancestors. **NO APPLICATION CHANGE.**
Every post-source change is in the four `docs/ai` release protocol documents.

## Preserved verification, not repeated

| Gate | Verified result on `0b20061` |
| --- | --- |
| Full suite | 1,487 tests / 87 files PASS, zero failures; Vitest 140.36 s |
| Focused T02–T07 | 819 tests / 40 files PASS, zero failures; 56.48 s |
| Payment-adjacent | 82 tests / 7 files PASS, zero failures; 9.83 s |
| Install / lint / typecheck / build | PASS |
| Clean local D1 | 22/22 migrations PASS |
| Actual-main upgrade | 0020→0022 PASS; 776 rows / 58 old tables preserved |
| Schema / FK / integrity | PASS; supplemental direct-PRAGMA limitation documented |
| Existing browser matrix | 264 assertions / 36 phases PASS; 121 commands; en/vi × 375/390/desktop; zero failures/page errors |
| Hosted source CI | Run 34387688066 SUCCESS on `0b20061` |

This publication continuation runs only ancestry/source-equivalence, diff and
relevant documentation checks. No expensive tests or browser matrix were repeated.
Docs PR #9 merged normally into #8 at `0420807968538f61b669569d064c404f67032174`.
Exact-head CI **34394236696 SUCCESS**; live #8 is non-draft, mergeable, and has no
unresolved review threads. Final release audit found no application merge blocker.
This closing status checkpoint changes documentation only; retain actual-head CI
as the merge gate. Exact lightweight checks are recorded in `RELEASE_CANDIDATE.md`.

## Safety and operator boundary

Planner/UI/AI production defaults remain OFF in checked-in state; live production
values were NOT inspected. No deployment, remote D1 migration or flag enablement.
**PayOS/payment code untouched. No real payment performed.** Legacy Week,
inventory commands, auth and household isolation remain unchanged.
Accepted T07 KV/duplicate-compute/option-clipping/timezone/provider-capacity limits
are not new publication blockers. Reviewed prices/safety remain explicitly absent.

## Next exact action

Publish this documentation-only readiness checkpoint without rewriting history.
Keep original PR #8; publication fallback PR #9 is already merged. Await user
permission for a normal protected merge, with green actual-head CI. No replacement
release PR or expensive source retest is needed. **MAIN NOT MODIFIED.**
After an operator normal merge, freeze `MAIN_RELEASE_SHA`; only then begin
separately authorized production-local reconciliation. Respect the existing
pre-deploy schema gate even when deploying later with planner flags OFF.

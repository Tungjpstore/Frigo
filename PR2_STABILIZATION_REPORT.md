# Frigo PR #2 Stabilization Report

## 1. Executive Summary

The existing hardening architecture was preserved and concrete auth, CSRF, OTP,
logout, isolation, quota, request-idempotency and queue-fencing regressions were
fixed. All local release gates pass: **297 tests, zero failures**. No existing
migration, payment-provider implementation, AI provider or Week domain algorithm
was modified. Merge remains conditional on hosted CI at the published head and
completion of the blocked running-browser checks; local success is not a claim
that the old failing hosted check is green.

## 2. Starting Commit

- Repository: `frigo-vn/Frigo`; existing PR #2, not a replacement PR.
- Branch: `codex/security-hardening-sync`.
- Fetched PR head: `26a98b9064145d80f93e4dc799e3ff4fc2564192`.
- Fetched main: `3f33d11e4cbf438e2bc3fa35ccb1de2f9856c071`.
- Read PR description, live review/check state, handoff, changed files and all
  current migrations, including 0014–0018. No later migrations existed.
- `BASELINE_AUDIT.md` was not present in the checkout or fetched Git history;
  absence is recorded, not replaced with an invented audit.

## 3. CI Failure Root Cause

GitHub validate job `101878220306`, run `34166415117`, failed with **162 pass /
1 fail**, reproduced by the complete local suite. `tests/unit/sync.test.ts`
mocked localStorage but not sessionStorage. Guest header initialization threw
before mocked fetch in `verifyOtp`; the network catch converted that into an
offline ApiError. It was not an absent OTP secret or a justification to bypass
OTP verification. The test now supplies both browser stores and asserts the
cookie/legacy-guest request contract. Header setup is outside the network catch.

## 4. CSRF Fix

Origins are parsed and compared exactly, not by prefix. Origin must be a
serialized HTTP(S) origin, without userinfo, paths or query strings. A present
invalid Origin never falls back to a trusted Referer. If Origin is absent, a
valid trusted Referer supplies the signal; neither means denial for cookie
mutations. Production session-bootstrap/logout endpoints also require the
signal before a cookie exists. Explicit development origins: localhost and
127.0.0.1 on ports 5173/8787, plus the exact configured APP_URL. Production does
not inherit the loopback exceptions. Development bearer-only protected API
calls do not receive cookie-CSRF checks. Production normal users remain
cookie-only, with no return to reusable localStorage JWT authentication.

## 5. OTP Atomicity Fix

Both authoritative consume paths require a conditional D1 update to affect
exactly one row: unused, not expired according to D1 time, attempts under five,
no active lock. Missing metadata fails closed too. Wrong attempts increment
conditionally in D1 and cannot exceed the shared budget when KV is absent or
failing. Registration races yield one session. Preliminary password-reset
verification does not consume; only final reset changes the password and issues
the new session. Password change and old-session revocation share a batch.
HMAC v1 and outstanding challenges are unchanged; no digest migration or
deployment invalidation is required. Production OTP disclosure and Turnstile
behavior have regression coverage.

## 6. Logout Fix

The frontend calls and awaits POST `/auth/logout` with cookies and a bounded
timeout, deduplicating simultaneous clicks. Replay stops and local private
identity/cache/store/query data clear immediately. Only confirmed server success
clears the durable pending marker and navigates to anonymous authentication.
The server revokes the D1 token-hash session, then expires the HttpOnly cookie;
another device's session is unaffected. Failure visibly says server revocation
is **not confirmed**, blocks private access/replay across reload and offers
retry. JS never claims it deleted an HttpOnly cookie. User ID, household,
profile, preferences, entitlement view, Week, inventory/shopping projections,
scan/cooking state and private queries reset.

## 7. Client Data Isolation Verification

Private keys use user + household. Legacy unowned inventory/shopping/Week keys
are deleted, not copied. Generation checks prevent late network responses and
offline continuations from restoring the previous user's data. Private views
verify identity before rendering; replay checks `/me` against current scope.
Outbox entries require user, household and operation IDs; foreign-owner entries
are never replayed. Physical storage stays one ownership-filtered key. Logout
removes private entries, and cross-tab identity changes clear in-memory state.
Guest migration now accepts the new guest cookie through a D1 ownership lookup
and reports explicit proof before client outbox rebinding. Cookie guest setup
is deduplicated; local-only guest mode omits unrelated cookies. Password-reset
auto-login synchronizes the frontend identity.

Private requests also carry expected user/household metadata checked against
the session authenticating that exact request. A separate `/me` preflight alone
cannot fence a cookie installed by another tab before its localStorage update.
Receipt payloads are no longer stored or trusted in browser history: the review
page loads only the authorized scan ID, including when revisiting old history.
File readers capture ownership before reading and are cancelled on replacement
or unmount, so a delayed callback cannot upload a previous owner's photo.

## 8. Scan Quota Race Fix

A serialized D1 batch conditionally inserts/reclaims one unique ledger row only
when the authoritative active-ledger count is below server entitlement, then
recomputes the `used_count` projection. No independent increment or compensating
decrement remains. Concurrent last-slot requests permit one winner. Duplicate
commands and released reclaims have one acquisition owner. Release recomputes
usage, so duplicate releases cannot refund someone else's charge. Reclaim
rotates the reservation ID, preventing an old handler from releasing the new
reservation. Queue retries do not reserve quota again. Expired Plus rows fall
back to the free allowance; client plan/quota flags are ignored.

Released commands reclaim into the current month, never a historical month's
unused allowance. Already-reserved/consumed commands keep their original period
without another charge. Real-SQLite rollover tests include a release racing the
preliminary lookup and concurrent reclaim of the current month's last slot.

## 9. Scan Idempotency Fix

ScanPage creates a UUID before its first request and retains it for the same
capture/type/owner retry. Both scan endpoints receive `Idempotency-Key`. The
server derives a tenant-scoped command/scan identity, validates key format, and
returns the existing ready or in-progress operation without rerunning AI or
charging again. Only the quota-acquisition winner starts new processing.
Ambiguous queue-send failures keep pending state/quota; retry delivers the same
job identity. Stable UI commands surface network failures instead of turning a
possibly accepted request into fabricated offline scan results. Existing explicit
legacy offline-draft import compatibility remains outside that UI upload path.

## 10. Queue Fencing Fix

Claim/reclaim validates state, lease and attempt budget in a single D1 batch.
Ready/confirmed/failed scans cannot regress to processing. Completion and
failure first conditionally rotate the active, unexpired claim to a fresh
transaction-only token. Every delete, insert and scan transition requires it;
the final job update uses the same token. A stale gate affects zero rows, and
every side-effect statement then also affects zero rows. SQL errors roll back
the whole batch, including deletions and token rotation. Active duplicate
delivery is retryable; terminal duplicate delivery is a no-op. Expired maximum
attempts terminalize job and scan with a single fenced decision. Terminal scans
remain terminal even after their historical job has been cleaned up.

## 11. Cleanup Compatibility

Real SQLite replay covers 0001–0018. Expired `sessions_v2` and expired/used OTPs
outside retention are removed; recent/active rows survive. Pending/processing
jobs are preserved even with old locks. Terminal jobs use the existing 30-day
ready / 90-day failed retention. Quota records are not swept, protecting
idempotency and active accounting. Repeated cleanup is idempotent and passes FK
checks. Smoke previously omitted migrations after 0012; it now executes them.
The schema gate additionally asserts non-payment hardening columns/migrations.
No new migration is required for these fixes.

## 12. Tests Added

134 new substantive tests/cases across seven files:

| File | Cases | Evidence |
| --- | ---: | --- |
| `tests/integration/auth-hardening.test.ts` | 60 | Exact/missing/malformed CSRF, cookie hashing/revocation, guest proof, OTP/reset races, KV outage, lockout, expiry, Turnstile, failure rollback and real cookie-switch read/replay fences |
| `tests/unit/client-session.test.ts` | 32 | Awaited logout/failure/reload, all-store reset, identity/household/cross-tab isolation, stale responses/outbox, cookie guest, owner-header normalization/override prevention and stable upload retry |
| `tests/integration/scan-quota-idempotency.test.ts` | 17 | Last-slot, same-command, reclaim/refund/month-rollover races, rollback, tenant scoping, expired/client Plus bypass, HTTP retry/ambiguous queue acceptance |
| `tests/integration/scan-queue-fencing.test.ts` | 15 | Lease reclaim/contention, stale success/failure, both scan types, duplicates, attempts, rollback, terminal cleanup replay |
| `tests/integration/cleanup-schema.test.ts` | 1 | Actual migrated session/OTP/job/quota retention and repeatability |
| `tests/unit/scan-privacy.test.tsx` | 8 | Delayed/cancelled image reads across identity changes and rendering that rejects legacy private receipt history |
| `tests/integration/worker-cors.test.mjs` | 1 | Actual Worker preflight permits the new owner-fence headers |

The shared SQLite adapter runs real constraints and non-interleaving batches;
barriers outside transactions force vulnerable interleavings rather than
mocking affected-row counts to pretend atomicity.

Three receipt-history rendering cases fail against the original page and pass
after the fix. The quota rollover suite likewise reproduced three failures
before its fix (14 pass / 3 fail), then passed all 17 cases. The JavaScript
Worker-entrypoint test avoids mixing DOM and Workers global types; the actual
entrypoint remains checked by `tsconfig.worker.json` in both typecheck and build.

## 13. Final Verification

| Gate | Result |
| --- | --- |
| Initial complete suite / hosted CI | 162 pass, 1 fail (163 total) |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 32 files, 297 pass, 0 fail |
| `pnpm build` | PASS |
| `pnpm check:migrations` | PASS — all 18 migrations |
| Local Wrangler migration application | PASS — `--local` only, 18 migrations |
| `pnpm schema:check:local` | PASS |
| `git diff --check` | PASS |
| Hosted CI at published stabilization head | Must be read after publication; auto-fix subscription enabled |
| Running browser logout/retry/isolation | BLOCKED by sandbox browser/Vite memory/lifecycle failures; not claimed as passing |

The isolated Vite/SQLite preview runner avoids the repository's default
production API proxy and disables external backend fetches. The auth page
rendered, but browser state/processes were repeatedly lost (OOM guard, esbuild
EPIPE, exit 143); setup/resize attempts were rejected by an active lifecycle
claim. Issues were reported to the platform. Unit/integration results above
remain confirmed; rendering alone does not prove the interactive flows.

A final retry reproduced the loss: the auth form rendered, then Vite and Chrome
were killed (PIDs 29105 and 29906) and the browser returned to `about:blank`.
The guard recorded about 1.1–1.4 GiB available; `/proc/meminfo` reported about
2 GiB total despite the advertised 16 GiB burst ceiling. The authorized resize
was again rejected because another operation was active. The guard was not
disabled or bypassed. The isolated runner is versioned in
`.hoplite/settings.json`; the effective project override points to the same
command because the platform currently fails to recognize that tracked file.

## 14. Remaining Risks

- Complete browser logout success/failure/retry and identity-switch checks once
  the preview runtime is stable. Do not label the current UI verification green.
- A process killed after quota reservation but before durable scan persistence
  can retain a reserved slot. It deliberately fails closed, never refunds an
  operation of uncertain outcome. Crash-recovery/reconciliation of such orphan
  reservations remains operator work; no unsafe automatic cleanup was added.
- Offline-only guests have no authenticated server scope; private replay waits
  for authenticated identity rather than trusting localStorage identifiers.
- Existing development-only legacy bearer compatibility remains; production
  normal API authentication requires opaque cookies. Legacy offline scan
  fixtures remain for existing explicit draft compatibility, not stable UI uploads.

Required security search was performed over current source, tests, packages,
migrations, scripts, docs and service worker. Relevant matches are classified:

| Search / location | Classification |
| --- | --- |
| `frigo_token`, `frigo_active_meal_plan` removals in client lifecycle/API | Safe legacy deletion; matching assertions are test fixtures |
| `localStorage` identity/preferences, scoped caches, pending marker and owned outbox | Safe non-credential persistence; audited in auth store, private-session, API, sync and local page identity reads |
| Bearer parsing in auth middleware/routes | Non-browser development API and signed guest-migration compatibility; normal production access rejected |
| Bearer headers in AI provider/email HTTP clients | Non-browser server-to-provider API, unchanged/out of scope |
| `sessions.token`, legacy OTP `code` schema/SQL references | Legacy migration/unused SQL compatibility only; active auth uses `sessions_v2.token_hash` and `auth_otps.code_digest` |
| `revoked_*` historical documentation | Legacy reference; handoff now states D1 revocation is authoritative |
| `sessions_v2.revoked_at` in middleware, auth routes and migration 0015 | Safe active D1 session-revocation checks/writes; not a legacy KV blacklist |
| `startsWith` in route selection, cookie parsing, local-key deletion, recipe/domain identifiers, voice language selection and asset paths | Safe non-origin comparisons; no auth origin-prefix acceptance remains |
| `claim_token`, `used_count`, `Idempotency-Key` in queue/quota/route SQL | Safe guarded invariants, schema expectations and regression fixtures |
| `X-Frigo-Expected-*` in private client requests, middleware and CORS | Request-owner consistency fence, not authentication or a replacement for cookie authorization |
| Existing Week/cooking/inventory command idempotency | Safe existing domain contracts; no domain redesign |
| `PLUS_GRANT_SECRET` route, config/type/docs | Deferred owner entitlement/payment activation work; implementation unchanged |
| Historical audit statements describing localStorage JWTs | Historical documentation, not current implementation |

## 15. Production/Main Drift

At investigation, main and PR head differed by the pre-existing hardening
commit. The PR description says production deployment and migrations 0014–0018
were completed separately. Repository-bound deployment queries for production
on main and the hardening branch returned no records; no push workflow evidence
for that hardening deployment was returned. Therefore the exact production SHA
is **unverified**, not assumed equal to `26a98b9`, main, or this patch.

Recommended owner sequence: verify the deployed release's GIT_COMMIT and
migration ledger via the approved operational process; retain a traceability tag
for that exact release; obtain green CI and complete browser verification;
merge PR #2 normally into main; tag the resulting main commit; reconcile release
records to those immutable SHAs before any separately approved deployment.
If production is ahead of main, preserve that commit/history and reconcile with
a normal merge/review, never force-push main. No remote inspection/mutation of
D1/KV/R2, production queue send, secret rotation or deployment was performed.

## 16. Deferred — PayOS / Payment Owner Action

The existing PR already contains payment foundation work. This stabilization
does **not** certify, fix or modify it. PayOS integration/webhooks/signatures,
provider credentials/configuration, intent/QR/checkout/reconciliation/settlement,
amount/status handling and payment migrations/UI are unchanged. The independent
legacy `PLUS_GRANT_SECRET` route remains unchanged because activation work is
deferred to the owner, not mixed into the security repair. Owner payment work
does not itself block the non-payment technical scope; it needs a separate
review and rollout decision.

## 17. Merge Recommendation

**BLOCKED pending hosted CI at the published head and completed interactive
browser verification.** The complete local test/build/schema gates are green,
and no known tested auth/OTP/quota/fencing/isolation invariant remains failing.
Do not merge merely on the original PR's stale validation claim. No merge or
production deployment was performed by this stabilization run.

# Frigo Final Hardening Report

## 1. Executive Summary

**LOCAL SUITE GREEN — HOSTED CI REQUIRES EXACT-FINAL-HEAD CONFIRMATION.**

Final hardening preserves opaque cookie sessions, D1 authority, OTP atomicity,
quota/idempotency ledgers, queue fencing, household tenancy and Week dual-write.
It closes account-reset privacy/configuration gaps, aligns quota/origin sources,
reduces session writes, and adds release-critical regression coverage. Adversarial
checks additionally exposed superseded reset OTP reuse and a multi-household
profile projection bug; both are fixed, not waived.

All local gates pass: **446 tests, 37 files, zero failures**. No PayOS/payment
implementation/configuration/schema was modified or certified. No production
deployment, remote migration or production data/configuration operation was run.
An initial preview misrouting incident is disclosed in section 15.

## 2. Starting Commit

- Requested repository: `frigo-vn/Frigo`; current tools resolve `vna-sex/Frigo`.
- Existing branch/PR: `codex/security-hardening-sync`, PR #2.
- Fetched starting SHA: `4fe18d28aa25f900a459b17932832d9c3d36852e`.
- Main: `3f33d11e4cbf438e2bc3fa35ccb1de2f9856c071`, unchanged at final pre-publish fetch.
- Starting-head hosted `validate` check: **SUCCESS**, job `101896267702`.
- No human reviews/unresolved review threads were present at investigation.
- Read current stabilization report, handoff, project status and deployment guide.
  `BASELINE_AUDIT.md` was absent at the fetched head; no replacement audit invented.

## 3. Final Commit

- Verified implementation commit: `af661af467ba8620ba6b2919ee958195d179380c`.
- The following report/release-policy commit pins `REVIEWED_HARDENING_BASE` to
  that implementation. The published ending SHA is the commit containing this
  report (`git log -1 --format=%H -- FINAL_HARDENING_REPORT.md`) and is recorded
  in PR #2's verification metadata. A file cannot embed its own Git commit hash.
- Hosted checks must match the **published ending SHA**, not merely the starting
  SHA or the implementation commit. No stale hosted-success claim is inherited.

## 4. Verification Baseline

Recorded before any implementation edits:

| Gate | Starting result | Final result |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | PASS | PASS |
| `pnpm lint` | PASS | PASS |
| `pnpm typecheck` | PASS | PASS |
| `pnpm test` | 309 passed / 0 failed, 32 files | 446 passed / 0 failed, 37 files |
| `pnpm build` | PASS | PASS |
| `pnpm check:migrations` | Initially blocked: missing sqlite3; PASS after existing setup dependency repair | PASS, all 18 migrations |
| Wrangler migrations, **local only** | PASS, all 18 applied | PASS, no pending migrations |
| `pnpm schema:check:local` | PASS | PASS |
| `git diff --check` | PASS | PASS |

The existing repository setup already installs sqlite3. The platform initially
failed to resolve the checked-out settings and rejected `sandbox_setup` on a
ready workspace. Its existing idempotent dependency-install command was run
locally; the platform issue was reported. No migration was changed to get green.
The final migration smoke also replays into fresh SQLite with FK/integrity checks.
Wrangler 3's upgrade notice and pnpm's ignored-build-script notices are warnings;
actual build and local Wrangler/schema commands completed successfully.

## 5. Account Enumeration Fix

`POST /api/v1/auth/forgot-password` and reset-purpose resend return HTTP 200 and
identical public JSON for known/unknown accounts:

> Nếu email này có tài khoản Frigo, hướng dẫn đặt lại mật khẩu sẽ được gửi đến email của bạn.

No email echo, account-dependent code, delivery-success field or provider error.
Unknown accounts perform random/HMAC work but receive neither D1 OTP rows nor
email. Known-account challenges persist before email delivery is registered with
Worker `executionCtx.waitUntil`; a deferred-provider test proves the response
does not await mail. Storage/delivery failures cannot become a public membership
oracle. This reduces obvious timing differences; it is not a constant-time
network or durable-email-queue guarantee. Development-only helper codes are not
part of the production response.

Reset issuance/resend atomically invalidates outstanding same-email/purpose OTPs
and inserts the replacement. Superseded codes fail before **and after** the new
code is consumed, including same-second issuance. Two adversarial tests failed
before these fixes and pass afterward.

## 6. Turnstile Production Hardening

Both `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are mandatory/nonblank in
production. Missing either or both produces fatal sanitized config/readiness
codes; direct route verification also fails closed. Login, registration,
forgot-password and OTP resend require valid tokens. Explicit development and
staging may omit the keys; unspecified environments do not bypass the verifier.
Authenticated APIs and OTP consumption are not burdened with new challenges.

Siteverify has an 8-second bound, accepts only successful HTTP + boolean `true`,
and rejects errors, malformed replies and duplicate/expired challenges. Client
resend now sends its token; the script URL correctly names `onTurnstileLoad`, and
auth retries remount a fresh widget instead of reusing consumed tokens. Browser
verification used a synthetic challenge fixture; live Cloudflare widget/mail
configuration still requires the owner’s approved environment check.

Reference: [Cloudflare explicit rendering and widget lifecycle](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/).

## 7. Quota Policy Consolidation

`src/worker/config/scan-quota-policy.ts` is the authoritative server source:

- Free: **5 scans per UTC calendar month**.
- Active Plus: **999999** (existing server cap preserved).
- Inactive/expired/missing subscriptions: Free entitlement.
- Reserved + consumed ledger rows count; released rows do not.
- `resetAt`: first instant of the next UTC month, including year rollover.

Reservation enforcement and read projection share entitlement/month functions.
Legacy mutable subscription counters/limit fields are not policy sources.
Registration/Google/guest subscription creation bind the same policy constant.
No payment intent/provider/activation behavior changed. Existing atomic final-slot
acquisition, reclaim rotation, release accounting and queue retry tests remain.

## 8. /auth/me Fix

The repository's canonical endpoint is **`GET /api/v1/me`**, not a new alias.
Previously it defaulted to 10 allowed / 1 used and read stale subscription usage.
It now returns `plan`, `limit`, `used`, `remaining`, `resetAt`, plus compatible
`maxScans`/`scansUsed` and expiry/Plus fields. One SQL snapshot reads entitlement
and current ledger usage, including when no subscription exists. It does not
create subscription/period/reservation rows. Database errors return 503 instead
of fabricated Free/zero state. Offline client quota is `null` (unknown).

The profile join now selects the **session's household ID and name**, not an
arbitrary membership. New multi-household/client replay tests exposed the prior
bug, which caused false identity resets and dropped pending work. This is a
scoped query fix, not a tenancy redesign.

## 9. CORS / Origin Configuration

`src/worker/config/origins.ts` normalizes validated HTTPS `APP_URL` for production
CORS and CSRF. Exact serialized-origin comparison rejects lookalike prefix/suffix,
userinfo/path/null/random origins. No credentialed wildcard, hardcoded production
fallback, or arbitrary non-production reflection remains. Explicit development
adds localhost/127.0.0.1 ports 5173/8787; staging does not inherit these exceptions.
Malformed Origin does not fall back to Referer. Vite now defaults to a local API
proxy instead of implicitly reaching production.

## 10. OTP Digest Improvements

New OTPs use **v2 HMAC-SHA-256** over JSON-encoded `[normalizedEmail, purpose, code]`.
JSON tuple encoding avoids delimiter ambiguity. Existing v1 code-only digests
remain verifiable until normal expiry; unsupported versions/malformed digests
fail closed. No existing schema/migration or key rotation is required.

D1 five-attempt limits, lockout, expiry, `used_at`, and conditional one-winner
consumption remain intact. Tests cover v1 compatibility, v2 email/purpose
transplants, unknown versions, reuse, concurrent consumption and reset session
revocation. Reset replacement invalidation is atomic with the new insert.

## 11. Logging / PII Improvements

Non-payment auth failures now emit static structured event names; email failures
carry only safe provider names/status. Native provider exceptions, HTTP response
bodies and network exception strings are not retained. The global error log no
longer includes raw exception text. Tests inject recipient/secret/OTP-like data
into exceptions and assert it does not appear in logs or diagnostics.

No OTP, digest, password, cookie, session token/hash or Authorization value is
logged by these modified flows. Normal browser credentials remain HttpOnly,
with only SHA-256 hashes persisted to `sessions_v2`. Development OTP responses
are deliberate local helpers, never production responses or log fields.
Unrelated domain logging was inspected but not broadly rewritten; manual Plus
activation errors remain payment-owner scope.

## 12. Session Write Optimization

D1 session lookup/revocation/expiry is still authoritative on every request.
`SESSION_LAST_SEEN_INTERVAL_MINUTES = 15`; recent sessions skip the update call,
new sessions initially use creation time, and stale sessions use a conditional
SQL update to avoid duplicate concurrent writes. Tests verify authentication,
three successive reads with zero touches, and one touch after 16 minutes followed
by no immediate second write. No KV validity cache, per-request background job,
sliding expiration or session architecture change.

## 13. CSP Status

- `script-src 'unsafe-inline'`: **absent**.
- `style-src 'unsafe-inline'`: **retained, explicitly deferred**.
- Exact application attributes: `CookingModePage.tsx:351`,
  `WeekSetupPage.tsx:112`, `WeekShoppingPage.tsx:180` set dynamic progress widths.
- The running auth page also contains a Google GSI-generated inline stylesheet.

Replacing three progress attributes alone would not certify widget compatibility.
Nonces do not authorize style attributes. Removal needs a bounded UI/widget
styling follow-up with live third-party rendering verification, not a header-only
change. Worker/static policies remain equal and existing CSP tests pass.

## 14. Cleanup Verification

Retention remains centralized in `src/worker/config/retention.ts`:

| Data | Cleanup policy |
| --- | --- |
| `sessions_v2` | Expired more than 30 days ago; active sessions retained |
| `auth_otps` | Expired more than 7 days ago; active challenges retained |
| Ready queue jobs | 30 days; matching tenant/terminal scan, no reserved quota, old update/completion |
| Failed queue jobs | 90 days; matching tenant/failed scan, no reserved quota, old update |
| Quota periods/ledger/reservations | No automatic deletion or refund |

Pending/processing jobs, active claims, inconsistent/replay-needed terminal jobs,
recently updated jobs and reserved quota are preserved. Real SQLite tests use all
current migrations, mixed timestamp formats and repeat cleanup. Missing production
security configuration skips cleanup rather than mutating an uncertain target.

## 15. Security Regression Tests

**Before:** 309/32 files. **After:** 446/37 files. **Added:** 137 tests. **Failed:** 0.

New/expanded coverage includes auth reset public parity and deferred mail,
Turnstile keys/tokens/provider failures, contextual/v1 OTPs and supersession,
last-seen writes, exact CORS/CSRF parity, authoritative `/me` and quota enforcement,
cleanup retention, release ancestry/CI/schema/SHA receipts, and real client code
against cookie-authenticated Hono routes backed by SQLite.

Client flows cover login → `/me` → inventory mutation; logout → old session denial
→ anonymous reload; A → logout → B → offline cache reads; household A → B with
inventory/shopping/Week isolation; expired-session reset; failed logout blocking;
and offline replay races both before and after another account/household replaces
the server session. Owner-mismatched outbox entries never commit as another owner.
No assertions were weakened to hide failures and no heavy browser framework added.

Running Chrome smoke passed login, `/me`, inventory read, logout/reload, A→B,
failed logout/reload/retry, generic reset UI, and distinct nonempty Turnstile tokens
on retries using a browser-only fixture. After restarting the final-source Worker,
signup/OTP/quota/reset supersession/logout passed again. Final browser error list
was empty. Screenshot proof redacts the development-only OTP badge.

**Preview safety incident:** platform settings resolution ignored the checked-out
isolated runner and launched the pre-existing Vite production API proxy. Two
synthetic registration attempts returned `403 TURNSTILE_FAILED` before account
creation. That server was stopped immediately; Vite's default proxy is now local,
and the existing isolated runner is explicitly configured as the managed run
override. The restarted runner was verified as development + in-memory SQLite,
with backend outbound fetch disabled. No production session/account/OTP was
created by those rejected requests; they were not intentional production tests.
The platform issue was reported. Live provider behavior is not certified by this
mock-mail/AI preview, and automatic canonical QA flows are not configured.

## 16. Release / Main / Production Reconciliation

Main remains `3f33d11e4cbf438e2bc3fa35ccb1de2f9856c071` before publication.
Production SHA and migration version are **unverified**: repository-bound
production deployment queries for main/hardening returned no records. Historical
LIVE/version claims do not establish the currently deployed Git SHA.

The release workflow now requires main-contained immutable SHA/tag selection,
approved final-hardening ancestry (minimum implementation `af661af`), and green
latest exact-SHA main-push CI. It rechecks after approval, keeps production
confirmation/Environment gates, runs local gates, and records source migration
checksums, observed migration names and matching deployed readiness SHA. Missing
or unknown migration ledger entries block release; no automatic migration runs.
Manifests remain artifacts for 90 days; owner archival is required beyond that.

Merge PR #2 normally **with a merge commit**, retaining hardened ancestry; obtain
CI on the resulting main SHA; approve/tag that immutable release; verify actual
production SHA/ledger and runtime configuration; then use a separately approved
cutover. Do not force-push, automatically merge or deploy from this task.

**Rollback:** a database at 0017+ cannot safely run pre-hardening plaintext-OTP
or legacy-session code. A code rollback must retain v2 OTP compatibility (or
explicit challenge invalidation), opaque sessions, queue fencing, quota and Week
dual-write. Restoring database state is a separate approved incident procedure;
source rollback is not schema rollback. See `DEPLOYMENT.md`.

## 17. Remaining Risks

- Published final-head hosted CI still requires confirmation; starting-head green
  is not final-head green. Auto-fix updates are subscribed on PR #2.
- Production SHA/schema, Environment reviewers, live Turnstile/email delivery,
  and AI provider/model availability require owner verification before deployment.
- Reset `waitUntil` delivery is best-effort, not a durable mail queue; failed sends
  use safe events and require resend. Response timing is not formally constant-time.
- Style unsafe-inline remains for explicit UI/third-party dependencies.
- KV rate limiting is best-effort under degradation; D1 OTP attempts and scan
  quotas remain authoritative. No broad rate-limit redesign was performed.
- Orphan/uncertain scan reservations deliberately retain quota; reconciliation and
  indefinite ledger-growth policy remain explicit operator/product work.
- Other domain error logs were not subjected to a broad logging refactor.

Final requested search classification:

| Pattern/region | Classification |
| --- | --- |
| `frigo_token`, unscoped Week/inventory keys | Safe legacy-key deletion and negative tests; no credential writes |
| Bearer / Authorization | Development-only legacy auth, guest/reset compatibility, outbound provider calls, tests; no normal production browser bearer auth |
| `sessions.token`, `revoked_`, `auth_otps.code` | Historical migrations/docs or negative tests; current validity uses sessions_v2 and code_digest |
| `devOtp` | Non-production helper and negative tests; production absent |
| `startsWith(` | Cookie/Bearer syntax, path/guest-ID/cache/category parsing; origin trust uses exact equality |
| `frigo_active_meal_plan` | Legacy cleanup/tests, not shared private storage |
| `unsafe-inline` | Style exception only; script negative tests/docs |
| Production hostname | APP_URL/route binding, mail sender, branding, historical docs/test fixtures; removed from CORS/default API proxy/smoke fallback |
| `TURNSTILE_` | Public site-key/config, secret-name declarations, mandatory validation and tests; no secret values introduced |
| `max_scans` | Policy/ledger projections, legacy migration fields, adversarial tests; no duplicated runtime allowance |
| `last_seen_at` | Throttled conditional touch, schema/history/tests |
| Auth/email `console.error/log` | Static safe events; raw auth/provider messages removed |
| Manual Plus/payment logs/config | Deferred — PayOS / Payment Owner Action |
| Other console/domain logs | Existing domain diagnostics/operational scripts; broader sanitization deferred, no new secret logging |

## 18. Deferred — PayOS / Payment Owner Action

PayOS provider/API/webhook/signature/credentials, `PAYOS_*`, VietQR/payment QR UI,
provider adapters/intents, reconciliation/matching/settlement, callback/checkout
URLs, status machines and payment schema remain untouched. Manual
`PLUS_GRANT_SECRET` activation remains owner review, including its existing raw
error handling. This work neither fixes nor certifies them. Migration 0018 is
replayed only as part of the existing local schema chain. Protected payment files,
all migrations and the manual Plus route compare unchanged against the starting
head. No formatting-only payment changes were made.

## 19. Merge Recommendation

**BLOCKED until exact published-head hosted CI is confirmed successful.** Local
security/reliability gates and the scoped browser smoke are green. After green
head CI and reviewer approval, merge retaining exact ancestry; separately fulfill
production/main/schema/configuration reconciliation before release. Never infer
production readiness merely from local tests or historical deployment claims.

**Production deployment: NOT PERFORMED.**

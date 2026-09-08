# Frigo Frontend + Security Integration Report

## 1. Executive Summary

**READY FOR REVIEW — LOCAL GREEN / HOSTED CI REQUIRES CONFIRMATION.**

The frontend production refactor has been manually ported onto the latest verified hardened source, with security taking precedence over conflicting frontend implementations. This is not a wholesale merge of PR #3. The resulting architecture combines HttpOnly opaque cookie sessions, server-verified identity, owner-fenced private state and offline operations with Query-backed server reads, split feature services, lazy routes and honest UI states.

Final local verification: **606 passed, 0 failed in 41 test files**; lint, web/worker typecheck, web/worker build, migration smoke and local D1 schema gate pass. The hardened baseline was 446 tests in 37 files; its security coverage is retained. An independent final read-only review found no actionable security or functional regression in the reviewed integration diff.

No worker/domain/payment/schema/deployment implementation or dependency version changed. No merge, production deployment, remote migration, production data mutation, secret rotation or payment activation was performed.

## 2. Security Base SHA

- Repository currently resolved by the authorized tools: **`vn-gif/Frigo`**. Historical owner names in older prompts/reports are not the current repository identity.
- Branch: `codex/security-hardening-sync`, PR #2.
- Verified head: **`25dc0ec7dfd251e366a8726983a4eedfc1a62247`**.
- Common ancestor with the frontend source: `3f33d11e4cbf438e2bc3fa35ccb1de2f9856c071`.
- Read the current hardening/stabilization reports and handoff. `BASELINE_AUDIT.md` was not present; no substitute audit or historical result was invented.
- Reconfirmed the hardened PR head before publication; unchanged from the starting inspection.

The opaque-session/D1 authority, exact-origin CSRF/CORS, OTP hashing/attempts/atomic consume/privacy, server quota ledger, scan command idempotency, queue claim fencing and hardened release gates are inherited unchanged. Existing backend regression tests continue to execute against the integrated tree.

## 3. Frontend Source SHA

- Branch: `hoplite/phanagoria-5576f2c5`, PR #3.
- Verified source head: **`fafe1cc72df15481aa67b7475d508c371b49f0a4`**.
- Independently checked frontend baseline: **180 passing tests**.
- Reconfirmed PR #3's head before publication; unchanged.

`FRONTEND_PRODUCTION_UPGRADE_REPORT.md` is retained with an explicit historical/superseded notice. Its old transport/cache claims are not the integrated contract.

## 4. Integration SHA

- Integration branch: **`hoplite/lato-941ea9fe`**, using the platform-authorized branch convention rather than the illustrative `integration/frontend-security` name.
- Verified source/test implementation commit: **`d270cd42c677cfd86e7b7fd167ed1453449cf88e`**.
- The subsequent report commit changes documentation only. The published PR description records its exact head SHA; that head, rather than either source branch's previous CI result, is the hosted-CI subject.
- PR target: **`codex/security-hardening-sync`**, not `main`.

The hardened commit is an ancestor of the integration. The frontend branch was not merged/cherry-picked wholesale, and no automatic ours/theirs conflict resolution was used.

## 5. Overlap Map

The pre-edit overlap assessment was saved in `.hoplite/artifacts/overlap-map.md`; its decisions are reproduced here so the report is self-contained.

| Files / surface | Manual resolution and reason |
| --- | --- |
| `src/web/App.tsx` | Combine the hardened QueryClient, SessionBoundary and identity-remount lifecycle with frontend Suspense/lazy routes; do not mount private pages before verification. |
| `src/web/services/api.ts` and new feature modules | Extract hardened implementations rather than copy the insecure frontend transport. Preserve cookie credentials, expected-owner headers, generation guards, scoped projections and stable operation IDs. Retain a compatibility facade. |
| `LandingPage.tsx`, `OnboardingPage.tsx` | Keep server-created guest identity and secure auth transition; port honest copy and neutral preference defaults. |
| `ProfilePage.tsx`, `SettingsPage.tsx` | Keep awaited server-confirmed logout and failure blocking; port the Query reads, honest presentation and accessible confirmation UI. |
| `tests/unit/sync.test.ts` | Retain owner/idempotency/credential assertions, adapt service imports, and replace fabricated offline detections with explicitly reviewed items. |
| `docs/HOPLITE_HANDOFF.md` | Preserve the security handoff and add the integrated contract above historical sections. |

Security-authoritative surfaces were reviewed even without textual overlap: `useAuthStore`, `SessionBoundary`, `private-session`, `query-client`, private image callbacks, Scan/Receipt flows, the offline outbox, and all worker/domain/schema/payment code. Frontend concepts in other pages/components, query keys, format helpers and tests were adapted to those invariants.

Additional manual integration fixes cover Query/Week-store synchronization, replay invalidation, offline Query execution, stale-response fencing, Home meal selection, Week generation failure states and dialog focus containment. A legacy sample-scan entry point was removed without changing hardened upload ownership/retry semantics.

## 6. Auth Integration

Normal and guest browser sessions use **opaque HttpOnly cookies** and `credentials: 'include'`. Reusable session credentials are not returned to or persisted by the integrated UI. Caller-supplied Authorization headers are stripped by the shared transport; expected-owner headers are derived from the captured identity, not caller overrides.

Removed the dormant guest Bearer path, guest-token reads and unused auth `token` fields. Legacy credential storage is deletion-only. `setAuthSession` now requires the server-confirmed user and household; it no longer fabricates `hh_<user>` when household data is missing. Browser identity/profile values remain non-secret projections and request fences, never authorization.

Logout remains awaitable and deduplicated. Private state is cleared immediately, replay is blocked, and failed/unconfirmed revocation remains durably blocked with a retry UI. Settings/Profile do not navigate as if logout succeeded before server confirmation.

An existing short-lived reset-purpose JWT/DTO is not a normal session: it is purpose-restricted (`typ: reset`, 15-minute expiry), unchanged, and unused/unpersisted by this UI. Google/Turnstile challenge credentials are not reusable Frigo session credentials.

## 7. SessionBoundary Integration

The shell is:

```text
QueryClientProvider (shared client)
  BrowserRouter
    AppErrorBoundary (user + household key)
      SessionBoundary
        Suspense (RouteFallback)
          Routes (user + household key; lazy pages)
```

SessionBoundary bootstraps `/me` through the shared QueryClient with `staleTime: 0` and `retry: false`. The existing cancelled-effect/identity guard is retained. Normal sessions require server confirmation; only an explicitly device-only offline guest may use the existing local guest projection. A mismatched `/me` fails closed and clears/blocks private identity rather than accepting another household's data.

Account/household transitions reset private caches and workflows and remount routes. Query cancellation/clearing is accompanied by service generation guards, so a late response or delayed body parse cannot populate the replacement owner's state.

## 8. Query Architecture

The single query-key factory includes **both user and household** for `/me`, inventory, recommendations, recipe details, Week lists/details, notifications and shopping. Query owns core server reads; Zustand retains workflow drafts and guarded offline Week projections.

The hardened shared client clears on private-session reset. Queries and mutations use `networkMode: 'always'` so services execute their existing owned offline projection/outbox logic instead of being silently paused by TanStack Query. `refetchOnReconnect: true` is explicit because always mode otherwise changes the reconnect default.

Week swap/cook/shopping mutations publish their guarded result into the corresponding Query cache as well as workflow state. Targeted invalidation refreshes dependent inventory, recommendation, recipe, Week, notification and shopping queries. Successful outbox replay invalidates affected query families; stale-owner results cannot update the new owner. No browser persistence of the Query cache was introduced.

## 9. API Client

`services/api.ts` is a thin compatibility facade. Implementation now lives in `http.ts`, `auth.ts`, `inventory.ts`, `scans.ts`, `recipes.ts`, `week.ts`, `shopping.ts` and `notifications.ts`.

The HTTP layer retains cookie transport, exact expected-owner headers, private-session generation checks before/after awaits and response parsing, structured auth/HTTP/offline errors, and existing idempotency/concurrency metadata. Auth/HTTP/conflict failures do not masquerade as network-offline success. Public recipe reads preserve the existing public-read exception while personalized recipe responses are still guarded.

No backend contract was redesigned. `src/worker`, `packages`, migrations, CI/release scripts and Wrangler configuration compare unchanged against the hardened base.

## 10. Offline Ownership

Private projections retain the hardened `frigo_cache_v2:<user>:<household>:<name>` scope. Unprovable legacy inventory/shopping/Week keys are deleted, not adopted based on household alone. Cleanup now also deletes suffixed legacy Week keys.

Outbox entries still require `userId`, `householdId` and stable `operationId`. Replay verifies `/me` for the expected owner, preserves idempotency and `If-Match`, handles permanent/conflict outcomes deliberately, and does not rebind another account's operations. Guest-to-account rebinding remains contingent on explicit server-backed household migration proof.

Offline scans produce empty drafts requiring manual review, not invented detections. The production sample-image/mock-payload button and its stale camera fallback copy were removed. Camera capture and real file upload, private file-reader fencing and stable scan retry IDs remain intact.

## 11. Home

Home derives the current meal, planned-meal progress, budget, recommendations and use-soon inventory from actual Query data. Time-aware selection considers the local date, meal window and completion state rather than showing an arbitrary breakfast all day.

Each data source has independent loading/error/retry/empty states, so a failed widget does not hide successful widgets. There is no hardcoded meal, expiry item, progress percentage, budget or unread dot. Also removed the stray `~650k - 720k` estimate in Week shopping; both estimate summaries now use the loaded plan's budget text.

## 12. Notifications

Notifications render the server result with loading/error/empty states; offline mode returns an honest empty list rather than invented alerts. No global unread dot or fabricated badge is displayed. Device preference toggles are explicitly local preferences, not evidence that server push/email delivery is enabled.

A stable unread/read-state feature remains deferred because the existing notification contract does not provide durable read-state identity. No backend notification feature was invented.

## 13. Recipe UX

RecipeDetail distinguishes pending, successful-not-found, request/offline error with retry and successful data. It does not leave a missing recipe in an infinite spinner or invent nutrition data. Recipes, MealDetail, Cooking and Week pages retain feature-service integration, ownership guards and explicit mutation errors.

Week generation now fails visibly when identity is absent or generation fails, instead of inventing a household or spinning indefinitely. Meal swapping exposes the existing store error and retry instead of silently swallowing it.

## 14. Onboarding

No cuisines, dietary restrictions or primary goal are preselected. Household size remains the neutral existing value of two; preference categories remain distinct. Onboarding uses a server-created guest session and requires explicit user choices; it does not silently introduce a demo identity or infer food preferences.

## 15. Accessibility

ConfirmDialog provides alertdialog semantics, initial focus, Tab/Shift+Tab containment, Escape cancellation and focus restoration. Existing destructive/exit actions use this UI instead of native alert/confirm flows. Loading/error components expose status/alert semantics and actionable retry controls. Global content text selection is restored while intentionally interactive surfaces retain their specific selection behavior.

Browser keyboard checks confirmed the dialog behavior. This is scoped verification, not a claim of a complete WCAG audit or screen-reader/device certification.

## 16. Lazy Loading

All route pages remain lazy imports under Suspense and the branded fallback. The build emits per-route and shared vendor chunks.

| Build | Main application JS chunk | Gzip |
| --- | ---: | ---: |
| Hardened baseline | 465.82 kB | 110.87 kB |
| Integrated source | 210.43 kB | 53.58 kB |

This is the main chunk comparison, not total transferred bytes or a measured performance score; separate vendor/route chunks still load as needed. No unrelated dependency upgrade was made.

## 17. Test Suite Merge

| Verification | Result |
| --- | --- |
| Hardened baseline | 446 passed / 0 failed, 37 files |
| Frontend source baseline | 180 passed / 0 failed |
| Integrated final `pnpm test` | **606 passed / 0 failed, 41 files** |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS, web and worker |
| `pnpm build` | PASS, lazy web build and worker compile |
| `pnpm check:migrations` | PASS, all 18 existing migrations |
| Local migration application and `pnpm schema:check:local` | PASS; local schema gate covers required hardening through 0017 |
| `git diff --check` | PASS |

The baselines overlap; 446 + 180 is not a valid expected union count. The integration adds 160 cases over the hardened baseline, including adapted frontend-service cases and new security/UI/Week-cache integration coverage. Hardened backend/security test files were not replaced with the smaller frontend suite.

Only two existing client test files needed contract updates: the dormant guest-Bearer assertion now enforces cookie-only auth, and the offline scan test supplies explicitly reviewed items instead of relying on a fabricated detection. New coverage checks injected Authorization headers, missing identity, account/household cache separation, stale results, reset/logout, owned replay, offline Query execution/reconnect, Week mutations, honest UI, mock-scan absence, lazy routing and private child gating.

Raw local logs remain in ignored `.hoplite/artifacts/final-{lint,typecheck,test,build,migrations,schema}.log`; baseline logs and build comparison are retained there as well. These are local results, not hosted CI.

## 18. Browser Smoke

The managed preview uses the repository's existing `scripts/security-preview.mjs`: the real Vite app and worker routes, isolated local SQLite, synthetic accounts, mock AI and disabled outbound backend fetches. No production bindings are loaded. The platform initially failed to resolve the checked-out setup/run settings; the existing repository setup was run and the project run override was explicitly set to this isolated runner. The platform issue was reported; no application deployment/configuration change was made to work around it.

| Flow | Observed result |
| --- | --- |
| Guest bootstrap and onboarding | Server-created identity; no preselected cuisines/restrictions/goal |
| Home, Inventory, Week, Shopping, Recipe | Real preview API data and honest empty states rendered |
| ConfirmDialog | Tab/Shift+Tab trap, Escape cancel and trigger focus restoration passed |
| Server-confirmed logout | Cookie-only request; identity, Query cache and private keys cleared |
| Account A to B | No prior inventory, Week, shopping, Query or owned-outbox data surfaced/replayed for B |
| Forced household mismatch | Failed closed with session-verification error; no mismatched private page |
| Offline mode | Query executes the owned projection/service path instead of pausing it |
| Injected Home/Week/Shopping/Recipe faults | Visible error/retry states; successful paths recovered after fault removal |
| Final Scan page | Real capture/upload controls only; camera-unavailable copy directs to the gallery, no sample scan |
| Final Home reload | Session verification completed and actual B-owned data rendered |

The Home screenshot uses only synthetic local data and is attached to the review handoff. Browser hardware camera capture, live email, Google sign-in, Turnstile, AI providers, real-device push delivery and production data/configuration are not certified by this isolated preview. Hardware camera availability is absent in the sandbox; the actual fallback was verified. Race coverage beyond the browser smoke is provided by the automated owner/fencing tests, not claimed as exhaustive manual browser exploration.

## 19. Security Regression Search

See [docs/FRONTEND_SECURITY_SEARCH.md](docs/FRONTEND_SECURITY_SEARCH.md) for the file-and-line classifications: **386 matching lines classified, zero unclassified BUG entries**. The search includes repository-owned source, tests, scripts, configuration, migrations, documentation and historical prompt-kit references; it excludes dependencies, binary/Git/build/ignored artifacts and the two self-referential audit reports.

Patterns include `frigo_token`, Authorization/Bearer, `user.token`, `data.token`, `sessionToken`, JWT, localStorage, sessionStorage, `demo_user`, `demo_household`, `frigo_active_meal_plan` and `resetToken`.

- **Normal web auth:** no reusable browser JWT/session-token persistence, active legacy token access, or Bearer path.
- **Legacy cleanup:** credential/cache key references only delete untrusted legacy state; no household-only adoption.
- **Non-secret storage:** scoped offline projections, owner-bound outbox, identity/profile projections, logout blocking and explicit local preferences.
- **Server-only:** unchanged purpose-restricted reset JWTs, legacy/development compatibility and provider Authorization; not normal web session credentials.
- **Fixtures/history:** negative tests, immutable historical seed migrations, local isolated configuration and historical documentation are labeled, not silently removed or claimed to execute as private-client fallbacks.
- **Additional fake-state sweep:** no production web `demo`, `mock`, sample-image promise, fabricated household fallback or old Week budget string remains. Random IDs in offline drafts/operations are not authentication credentials or invented scan content.

Classification is an inspection aid, not a substitute for the passing behavior and security tests.

## 20. Remaining Issues

1. **Hosted validation is not yet certified for the published integration head.** The unchanged CI workflow triggers PRs only against `main`/`master` and pushes only to `main`, `master` or the hardened branch. An integration PR targeting the hardened branch therefore does not automatically match these triggers. Absence of a check is not success. Exact-head checks/status must be inspected after publication; a separate authorized CI trigger update or validation path is required before a merge-ready claim.
2. Live provider/production migration-ledger/release-environment prerequisites from the hardening report remain separate owner work. No inherited deployment-readiness claim is made here.
3. Stable notification read state/delivery enablement and full accessibility/hardware certification are outside this integration's verified scope.

No known unresolved code/security regression was found by the final review. **LOCAL GREEN / HOSTED CI REQUIRES CONFIRMATION** remains the honest gate until independent exact-head evidence exists.

## 21. Deferred — PayOS / Payment

PayOS/VietQR provider integration, credentials, signatures, webhooks, checkout/QR/callback/status/reconciliation/settlement, payment migration 0018 and manual Plus activation are unchanged and uncertified. No payment-worker routes, payment components, amounts, entitlements or billing enforcement were altered. Existing paywall routing is retained through the lazy application shell only. Payment-owner review is separate from this frontend/security integration.

## 22. Merge Recommendation

**Review this integration PR against `codex/security-hardening-sync`; do not independently merge the old frontend PR #3 into main.** Security wins the documented manual resolutions, the hardened ancestry is retained, and the full local combined suite is green.

Do not merge until exact-head hosted validation and human review conditions are satisfied. Preserve the hardened ancestry required by the existing release gates, and keep deployment as a separately authorized operation subject to the hardening report's production prerequisites. No merge or close action has been performed on the integration, frontend or hardened PRs.

**Production deployment: NOT PERFORMED.**

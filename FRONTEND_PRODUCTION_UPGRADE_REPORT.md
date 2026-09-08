# FRONTEND PRODUCTION UPGRADE REPORT

Scope: `src/web` only. No backend (`src/worker`), domain (`src/domain`), schema,
or payment code was modified. Production deployment: **NOT PERFORMED**.

## 1. Goals

Upgrade the Frigo frontend from MVP to production-grade while preserving:

- The mobile-first emerald/dark-green visual identity, rounded cards, icons,
  BottomNav, and Frigo Week visual language.
- The existing backend contracts: auth/session, tenancy, OTP, CSRF, scan
  quota, inventory concurrency (`If-Match`/version), Week dual-write, queue
  fencing, idempotency, and PayOS/VietQR payment boundaries.
- The offline-first architecture: outbox replay, stable mutation IDs,
  ownership fencing, and household-scoped projections.

## 2. Architecture changes

### 2.1 State-ownership model (enforced, not aspirational)

| Kind of state | Owner |
| --- | --- |
| Server data (inventory, recipes, Week plans, notifications, me) | TanStack Query |
| Workflow / UI / client state (auth session, onboarding draft, scan flow) | Zustand |
| Safe offline projections & device preferences | `localStorage`, scoped per user+household |
| Ephemeral UI (dialogs, form inputs) | React state |

### 2.2 Service layer split

The 1,200-line monolithic `src/web/services/api.ts` was split into domain
services; `api.ts` remains a thin compatibility facade re-exporting the same
`api.*` surface so untouched call sites keep working:

- `services/http.ts` — fetch wrapper, Bearer auth, `ApiError` taxonomy
  (offline / unauthorized / server), unauthorized cleanup, current
  user+household scope, household-scoped offline cache helpers, legacy
  Week-plan cache migration.
- `services/auth.ts`, `inventory.ts`, `recipes.ts`, `week.ts`, `shopping.ts`,
  `scans.ts`, `notifications.ts` — one file per domain.

Behavioral invariants preserved (verified by tests):

- Inventory writes queue to the outbox when offline with stable IDs,
  idempotency keys, and `If-Match` versions; conflicts surface as real errors.
- Week plans are server-authoritative online with a household-scoped cached
  offline projection; offline generation uses the domain engine.
- Recipes are server-first; bundled recipes are an explicit offline
  projection only.
- Notifications return server data online and an honest empty list offline —
  never fabricated alerts.
- Offline scans produce explicit empty drafts with stable offline IDs; no
  fabricated AI detections.

### 2.3 Query keys and tenancy privacy

`src/web/lib/queryKeys.ts` is the single query-key factory. Every server-state
key embeds the current `userId` + `householdId`, so cached data cannot leak
across account or household switches. Offline projection keys
(`inventory`, week plan, shopping) are household-scoped in `localStorage`;
notification reminder preferences are user-scoped.

### 2.4 Route-level code splitting

All routes in `App.tsx` are `React.lazy` with a branded `RouteFallback`.
The production build emits per-route chunks plus split vendor chunks
(`vendor-react` ~162 KB, `vendor-query` ~42 KB, `vendor-icons` ~31 KB,
entry ~198 KB); heaviest route chunk is WeekDashboard at ~22 KB.

## 3. Honest data (fabrications removed)

- **Home** previously showed hard-coded `5/7` meals, `71%` progress, and
  `560k / 800k` budget. It now runs three independent queries (inventory,
  recommendations, current Week plan) and derives today's meal, weekly
  progress, budget, and use-soon items from real data — with independent
  loading / error / retry / empty / no-plan states per widget
  (`components/common/AsyncState.tsx`).
- **Onboarding** defaults are neutral: household size 2, no preselected
  cuisines or restrictions; cuisine tags limited to actual cuisine taxonomy.
- **Notifications** are server-derived with honest loading/error/empty
  states; no fabricated notification dot. No unread badge was added because
  the worker generates notification IDs with `Date.now()` (unstable identity
  across refreshes) — see Deferred.
- **Recipe detail** rewritten on TanStack Query with explicit loading, error,
  retry, not-found, and honest nutrition states (omitted when unknown).

## 4. UX / accessibility

- New `ConfirmDialog` (`role="alertdialog"`, focus management, Escape,
  backdrop cancel, destructive styling) replaced every `alert()` /
  `window.confirm()` in Settings, Cooking Mode, and Inventory delete.
  Zero native dialog calls remain in `src/web`.
- Global `user-select: none` removed; text selection is restored everywhere
  except buttons, links, role-buttons, and intentional full-screen surfaces
  (Scan, Week setup card).
- Mutation errors are visible in the UI (Vietnamese, non-technical copy —
  no HTTP/D1/queue internals exposed).
- `EmptyState` / `AsyncState` / `RouteFallback` give consistent honest
  loading, error+retry, empty, and offline presentations.

## 5. Tests

Added `tests/unit/frontend-services.test.ts` (17 tests): query-key privacy
across account/household switches, household-scoped projections + legacy
Week-plan migration, HTTP error taxonomy, honest offline notifications,
recipe offline projections, inventory offline queueing / stable IDs /
`If-Match` / idempotency / conflicts, and Vietnamese formatting helpers.
`tests/unit/sync.test.ts` updated for the service split.

## 6. Verification

All green at time of writing:

- `pnpm lint` — pass
- `pnpm typecheck` — pass
- `pnpm test` — 26 files, 180 tests (baseline 163)
- `pnpm build` — pass, route + vendor chunks emitted
- `pnpm check:migrations` — pass
- Payment guard: `git diff src/web/components/payment/ src/worker/ src/domain/`
  is empty.
- Local browser smoke (Wrangler 4 + local D1, mocked AI): landing, guest
  onboarding with neutral defaults, Home real data + honest empty states,
  inventory add end-to-end, accessible delete confirmation (Escape cancels).

## 7. Deferred — PayOS / Payment Owner Action

- `src/web/components/payment/VietQRModal.tsx` untouched by policy. Any
  payment UX gaps (loading/error states, polling behavior) require the
  payment owner's review before changes.

## 8. Other deferred items

- **Notification unread identity**: worker generates IDs from `Date.now()`;
  a stable server-side ID is needed before any unread badge/count.
- **Notification preferences** are device-local (labeled as such in UI)
  until a backend preference endpoint exists.
- **Week/shopping full TanStack Query migration**: reads partially migrated;
  the dual-write/offline generation flows keep their proven service path to
  avoid destabilizing fencing and replay.

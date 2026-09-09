# T06B isolated preview and integration checks

## Local environment

The managed run command is `node scripts/security-preview.mjs`. The inspected
project-settings override selects that same command. No setup, dependency,
production Worker route, auth middleware or deployment setting was changed by this
preview subtask. Use the managed Preview action; do not start a competing server.

The Node host serves the real Vite app and Hono Worker against `SqliteD1` from
`tests/helpers/sqlite-d1.ts`. Every database is in-memory and replays migrations
0001–0022. `scripts/planner-preview-fixtures.mjs` seeds one synthetic registered
member/household, three recipes with steps, and three inventory lots. It is
idempotent and transactional. No reviewed offers, safety reviews or nutrition
facts are fabricated. Tomato shortages make the shopping uncertainty visible;
`shopping_allowed` can generate seven dinners, while `cook_now` cannot satisfy
the recipes from this stock.

Only the preview Vite configuration defines `VITE_MEAL_PLANNER_ENABLED=true`;
the in-memory server environment sets `MEAL_PLANNER_ENABLED=true`. Ordinary Vite
build/production flags are unchanged. The Vite API proxy explicitly targets the
local API, and backend `fetch` throws instead of contacting external providers.
The preview cache implements expiring text/JSON KV entries, retaining actual
Worker rate-limit behavior. Reset replaces both database and cache. Preview-only
request serialization keeps reset from closing an in-flight database.

## Login, reset and state controls

Open `/__preview` in the managed browser and choose login or reset-and-login.
All controls below are served by the Node preview host, **not Worker routes**:

| Endpoint | Method | Effect |
| --- | --- | --- |
| `/__preview` | GET | Synthetic-data control page |
| `/__preview/login` | POST | Issue a real registered session, preserving data |
| `/__preview/reset` | POST | Replace this preview's in-memory state and issue a new session |
| `/__preview/state` | POST | Read fixture identity, inventory/revisions, plan/event counts |
| `/__preview/stale-inventory` | POST | Increment the synthetic chicken lot's quantity/version for stale UX testing |
| `/__preview/ready` | GET | Verify the cookie before entering the app |
| `/__preview/session.js` | GET | Bootstrap the existing auth store using authenticated `/api/v1/me` data |

POST controls require an exact same-origin `Origin`; cross-site and sibling-site
fetch metadata is rejected. Responses are non-cacheable. Sessions use random
tokens, only their SHA-256 hashes persist, and cookies retain `__Host-`, Secure,
HttpOnly, Path=/ and SameSite=Lax. JSON login (`Accept: application/json`) returns
the cookie in its header, never the body. Form login redirects through session
verification to `/planner`. It does not install a fake bearer token or hardcoded
browser identity. Reset revokes old sessions and clears pending preview rate limits.
Never point these fixture helpers at a persistent or production database.

## Repeatable API product flow

```sh
pnpm exec vitest run tests/e2e/planner-preview.test.mjs
node --check scripts/security-preview.mjs
node --check scripts/planner-preview-fixtures.mjs
node --check tests/e2e/planner-preview.test.mjs
```

These are **API integration tests**, not browser-rendering proof. They use the
actual Worker middleware, registered cookies, real SQLite constraints, T02–T05
engines and API schemas; no planner/shopping results are mocked. The main flow
generates seven meals, loads meal detail, requests unknown-price shopping, discovers
swap choices, swaps with a new revision, requests deterministic explanations,
records swap/cooked feedback, then creates a new cookie session and rediscovers
the revised plan through `/current`. Other cases cover stale inventory, shopping
revision rejection/recovery, actual infeasibility, liked/disliked/skipped feedback
and replay, unchanged real stock/cooking history, feature-off/auth/CSRF gates,
fixture reset/revocation, real rate limits and absence of production login controls.

No Playwright/Puppeteer/browser test dependency was installed. The repository's
existing Vitest runner suffices for this integration suite; browser verification
uses the parent's managed browser session and remains a separate gate.

## Browser handoff checklist

1. Reset via `/__preview`, arrive at `/planner`, and generate from `/planner/new`.
   Choose a future start date, seven days, two servings, dinner, shopping allowed.
2. Open a meal at `/planner/:planId/meal/:slotId`; inspect ingredients, steps,
   explicit unknown nutrition and deterministic reasons. Swap to a named choice;
   verify the full new revision appears, not a local card-only replacement.
3. Open `/planner/:planId/shopping`; unknown prices must not become an exact zero
   total or a within-budget claim. Checkboxes must not add stock or make purchases.
4. Give feedback, reload `/planner`, and confirm current-plan restoration.
5. POST `/__preview/stale-inventory` with same-origin credentials, then revisit the
   plan/shopping view and regenerate explicitly. Old-revision shopping must not
   remain authoritative. Reset before independent scenarios to avoid rate limits.
6. Repeat core actions at 375px width and with keyboard navigation. Inspect dialogs,
   labels, focus, reachable actions, overflow and Vietnamese/English wording.

The preview subagent deliberately does not share the parent's active browser or
restart/reset its running server. Appearance, mobile interaction and loading/error
UI assertions must be reported from that separate fresh browser run.

## Subtask verification (2026-09-09)

- `pnpm exec vitest run tests/e2e/planner-preview.test.mjs`: **17 tests / 1 file
  PASS**. Log: `.hoplite/artifacts/t06b/preview-integration.log`.
- The three `node --check` commands above: PASS.
- `pnpm exec eslint scripts/security-preview.mjs scripts/planner-preview-fixtures.mjs tests/e2e/planner-preview.test.mjs`: PASS.
- `git diff --check -- scripts/security-preview.mjs`: PASS. No package/lock change;
  no production source references to `planner-preview-fixtures` or `/__preview`.
- Read-only `curl` probes against the already-running `http://127.0.0.1:3000`:
  `/__preview`, `/__preview/ready`, `/__preview/session.js`, `/planner` returned 200;
  unauthenticated `/api/v1/me` returned 401. No fixture or browser state was changed.
- An equivalent inline Node health probe was blocked by the platform's command
  policy before execution; reported to Hoplite and replaced with ordinary curl.
  This was not an application failure.
- Parent owns final repository-wide gates, mandatory state/board/handoff updates,
  browser/mobile verification, commits and publication. No browser evidence or
  repository-wide gate success is inferred from this subtask.

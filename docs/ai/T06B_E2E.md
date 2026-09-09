# T06B isolated preview, API integration and browser checks

## Repeatable browser suite (continuation)

The existing managed browser/Vite stack now runs real DOM interactions through
`tests/e2e/planner-browser.mjs`. No parallel Playwright/Puppeteer stack is installed.
Start the managed preview, then pass the exact contents of
`tests/e2e/planner-browser.commands.json` as finite stdin to
`browser_cli` with `args: ["batch", "--bail"]`. Equivalently, outside Hoplite's
managed session, the native CLI supports `agent-browser batch --bail <
tests/e2e/planner-browser.commands.json`. Within Hoplite use the browser tool,
not a shell-launched alternate browser/session.

The command file resets only this in-memory preview, logs into the actual
registered synthetic session, and runs English at 375×812 and Vietnamese at
390×844. Each viewport is set in the same batch as its assertions. Modules refuse
non-loopback hosts and require the preview-only state endpoint.

| Browser phase, per locale | Named assertions | Evidence scope |
| --- | ---: | --- |
| `happy(locale)` | 30 | Real Worker: no current plan, seven-day generation, detail, full swap, all feedback, disabled-AI fallback, shopping uncertainty, regeneration, stale inventory and cache invalidation; mobile structure/control names |
| `restored()` after actual document navigation | 2 | Current-plan discovery redirects to the latest private revision after reload |
| `presentationFailures()` | 5 | Explicit frontend response fixtures: JPY 4,820 known subtotal plus two unknown items, unknown budget, mobile fit, useful 429 and no retry loop |
| `revisionConflict()` | 2 | Real second-actor regeneration causes stale mutation 409, followed by latest-plan recovery |
| `alternativesConflict()` | 2 | Real second-actor regeneration causes alternatives 409; retry refreshes the full plan before alternatives can reload |
| `keyboardDialog()` + native key commands + `keyboardClosed()` | 3 | Focus entry, Tab/Shift+Tab wrap, Escape close and trigger focus return |

Total: **44 named browser assertions per locale, 88 across 12 phase executions**.
These are browser assertions, not 88 independent Vitest tests. The mixed-price
response substitution is deliberately not engine/retail-provider evidence. All
other product flows use actual Worker/SQLite/T02–T05 results; production's missing
reviewed retail offers remain unknown. Native key events are issued by the browser
tool, not synthetic DOM events. No private/customer data or provider keys are used.

See `T06B_VERIFICATION.md` for final executed results, failures corrected and exact
verified code SHA. The earlier 17-case suite below remains API integration, not
browser-rendering proof. Screenshots are synthetic current-state evidence; no
live-provider or production-rollout claim is implied.

## Local environment

The managed run command is `node scripts/security-preview.mjs`. The effective
project-settings override selects that exact repository command because the
platform misdetected the tracked settings file. The existing setup command is
also mirrored exactly. Mounted component/hook tests use a test-only jsdom dependency;
the browser replay adds no separate browser stack or production dependency.
No production Worker route, auth middleware or deployment setting was changed.
Use the managed Preview action; do not start a competing server.

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

## Historical preview-subtask verification (before continuation)

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

# Frontend Security Search Classification

Search of repository-owned text in the final integrated worktree, including tests,
configuration, scripts, migrations, historical reports, and prompt-kit references.
Dependencies, binary files, Git metadata, ignored artifacts and these two audit
reports are excluded (their search-term descriptions would be self-referential).
Counts below are matching lines per pattern, not credential values. Every matching
line is classified below; no matching raw secret is reproduced here.

`src/web` has **zero** normal or guest Bearer transport, JWT persistence,
`user.token`, `data.token`, `sessionToken`, `demo_user`, or `demo_household` use.
Its `frigo_token` hits are deletion-only legacy cleanup. Non-secret identity IDs
are expected-owner fences, never authorization. Existing server reset JWTs are
purpose-restricted (`typ: reset`, 15 minutes), are not web sessions, and remain
unchanged; the UI does not store/use the resetToken DTO. Server provider Bearer
requests are unrelated to browser auth. Historical demo seed rows are not selected
as fallbacks by the integrated private client.

| Pattern | Matching lines |
| --- | ---: |
| `frigo_token` | 19 |
| `Authorization/Bearer` | 40 |
| `user.token` | 0 |
| `data.token` | 0 |
| `sessionToken` | 2 |
| `JWT` | 79 |
| `localStorage` | 204 |
| `sessionStorage` | 20 |
| `demo_user` | 10 |
| `demo_household` | 20 |
| `frigo_active_meal_plan` | 17 |
| `resetToken` | 5 |

| File:line | Patterns | Classification | Justification |
| --- | --- | --- | --- |
| `.dev.vars.example:24` | JWT | SAFE | Configuration, validation, or local operational reference; not production web credential persistence. |
| `DEPLOYMENT.md:52` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `DEPLOYMENT.md:148` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `FINAL_HARDENING_REPORT.md:290` | frigo_token | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `FINAL_HARDENING_REPORT.md:291` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `FINAL_HARDENING_REPORT.md:294` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `FINAL_HARDENING_REPORT.md:295` | frigo_active_meal_plan | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `FRONTEND_PRODUCTION_UPGRADE_REPORT.md:5` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `FRONTEND_PRODUCTION_UPGRADE_REPORT.md:31` | localStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `FRONTEND_PRODUCTION_UPGRADE_REPORT.md:40` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `FRONTEND_PRODUCTION_UPGRADE_REPORT.md:65` | localStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:28` | localStorage, sessionStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:43` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:45` | JWT, localStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:96` | localStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:231` | localStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:232` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:241` | frigo_token, frigo_active_meal_plan | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:242` | localStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:243` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:244` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PR2_STABILIZATION_REPORT.md:253` | JWT, localStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PROJECT_STATUS.md:19` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PROJECT_STATUS.md:58` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PROJECT_STATUS.md:69` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PROJECT_STATUS.md:70` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PROJECT_STATUS.md:73` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PROJECT_STATUS.md:159` | localStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PROJECT_STATUS.md:221` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PROJECT_STATUS.md:227` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `PROJECT_STATUS.md:232` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `README.md:91` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/HOPLITE_HANDOFF.md:14` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/HOPLITE_HANDOFF.md:34` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/HOPLITE_HANDOFF.md:266` | sessionStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/HOPLITE_HANDOFF.md:273` | Authorization/Bearer | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/PROJECT_AUDIT_AND_ROADMAP.md:9` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/PROJECT_AUDIT_AND_ROADMAP.md:77` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/PROJECT_AUDIT_AND_ROADMAP.md:88` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/PROJECT_AUDIT_AND_ROADMAP.md:109` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/PROJECT_AUDIT_AND_ROADMAP.md:215` | JWT, localStorage | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/PROJECT_AUDIT_AND_ROADMAP.md:243` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/PROJECT_AUDIT_AND_ROADMAP.md:320` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `docs/PROJECT_AUDIT_AND_ROADMAP.md:351` | JWT | SAFE | Documentation/historical reference, not executable web auth; current integration report supersedes old claims. |
| `migrations/0002_seed_data.sql:48` | demo_user | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:51` | demo_user | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:54` | demo_user, demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:57` | demo_user, demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:60` | demo_user | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:63` | demo_user | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:66` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:70` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:71` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:72` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:73` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:74` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:75` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:76` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:77` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:81` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:82` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:83` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:84` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:85` | demo_household | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:89` | demo_user | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0002_seed_data.sql:90` | demo_user | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `migrations/0015_auth_session_otp_hardening.sql:23` | JWT | LEGACY MIGRATION | Immutable schema/seed history, unchanged; not a browser auth or request fallback. |
| `packages/ai/src/providers/deepseek.ts:40` | Authorization/Bearer | SAFE | Server-to-provider Authorization; no provider secret or session credential persisted in browser. |
| `packages/ai/src/providers/deepseek.ts:65` | Authorization/Bearer | SAFE | Server-to-provider Authorization; no provider secret or session credential persisted in browser. |
| `packages/ai/src/providers/glm.ts:37` | Authorization/Bearer | SAFE | Server-to-provider Authorization; no provider secret or session credential persisted in browser. |
| `packages/ai/src/providers/glm.ts:95` | Authorization/Bearer | SAFE | Server-to-provider Authorization; no provider secret or session credential persisted in browser. |
| `packages/ai/src/providers/groq.ts:220` | Authorization/Bearer | SAFE | Server-to-provider Authorization; no provider secret or session credential persisted in browser. |
| `packages/ai/src/providers/groq.ts:259` | Authorization/Bearer | SAFE | Server-to-provider Authorization; no provider secret or session credential persisted in browser. |
| `packages/ai/src/providers/qwen.ts:38` | Authorization/Bearer | SAFE | Server-to-provider Authorization; no provider secret or session credential persisted in browser. |
| `packages/ai/src/providers/qwen.ts:100` | Authorization/Bearer | SAFE | Server-to-provider Authorization; no provider secret or session credential persisted in browser. |
| `pnpm-lock.yaml:3186` | JWT | SAFE | Configuration, validation, or local operational reference; not production web credential persistence. |
| `scripts/migration-smoke.sh:26` | demo_household | SAFE | Configuration, validation, or local operational reference; not production web credential persistence. |
| `scripts/migration-smoke.sh:108` | demo_user | SAFE | Configuration, validation, or local operational reference; not production web credential persistence. |
| `scripts/release-check.mjs:74` | Authorization/Bearer | SAFE | Configuration, validation, or local operational reference; not production web credential persistence. |
| `scripts/security-preview.mjs:18` | JWT | DEVELOPMENT-ONLY | Isolated local preview configuration with synthetic secret; external backend fetch disabled. |
| `src/web/lib/private-session.ts:12` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:13` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:18` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:22` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:43` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:44` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:46` | frigo_active_meal_plan | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/lib/private-session.ts:47` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:53` | frigo_token, localStorage | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/lib/private-session.ts:54` | sessionStorage | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/lib/private-session.ts:55` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:56` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:58` | localStorage, frigo_active_meal_plan | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/lib/private-session.ts:70` | frigo_token | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/lib/private-session.ts:72` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:74` | sessionStorage | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/lib/private-session.ts:83` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/private-session.ts:84` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/lib/sync.ts:52` | localStorage | SAFE | Durable outbox; every operation requires user, household, operation ID and guarded replay. |
| `src/web/lib/sync.ts:57` | localStorage | SAFE | Durable outbox; every operation requires user, household, operation ID and guarded replay. |
| `src/web/lib/sync.ts:66` | localStorage | SAFE | Durable outbox; every operation requires user, household, operation ID and guarded replay. |
| `src/web/pages/NotificationsPage.tsx:49` | localStorage | SAFE | User-scoped device preferences; explicitly not server unread state or notification delivery enablement. |
| `src/web/pages/NotificationsPage.tsx:87` | localStorage | SAFE | User-scoped device preferences; explicitly not server unread state or notification delivery enablement. |
| `src/web/pages/ScanPage.tsx:57` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/services/auth.ts:25` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/auth.ts:75` | resetToken | SAFE | Existing short-lived reset-purpose DTO only; unused by UI, not persisted or accepted for normal API authentication. |
| `src/web/services/http.ts:167` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/http.ts:168` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/http.ts:186` | localStorage, frigo_active_meal_plan | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/services/http.ts:187` | localStorage, frigo_active_meal_plan | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/services/http.ts:192` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/http.ts:197` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/http.ts:205` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/inventory.ts:18` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/inventory.ts:26` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/inventory.ts:46` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/inventory.ts:74` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/inventory.ts:97` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/inventory.ts:119` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/inventory.ts:151` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/recipes.ts:73` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/recipes.ts:109` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/scans.ts:57` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/scans.ts:137` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/shopping.ts:12` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/shopping.ts:20` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/shopping.ts:37` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/shopping.ts:55` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/shopping.ts:76` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/shopping.ts:94` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:21` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:23` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:30` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:58` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:67` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:89` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:122` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:141` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:164` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:185` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:198` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:209` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:225` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:263` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:268` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:275` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/services/week.ts:369` | localStorage | SAFE | Private offline projection behind user+household cache keys and session-generation checks. |
| `src/web/stores/useAuthStore.ts:57` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:58` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:60` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:61` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:62` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:63` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:64` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:65` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:88` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:99` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:113` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:115` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:116` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:117` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:118` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:119` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:120` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:121` | frigo_token, localStorage | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/stores/useAuthStore.ts:122` | sessionStorage | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/stores/useAuthStore.ts:123` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:124` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:151` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:152` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:153` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:154` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:168` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:169` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:170` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:171` | frigo_token, localStorage | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/stores/useAuthStore.ts:187` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:196` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:202` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:226` | sessionStorage | LEGACY MIGRATION | Deletes legacy credential/private-cache keys; no reads, adoption, or credential writes. |
| `src/web/stores/useAuthStore.ts:230` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:231` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:232` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:233` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:234` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/web/stores/useAuthStore.ts:235` | localStorage | SAFE | Non-secret identity/profile/entitlement projection, offline mode, or logout fence; server authorizes every private request. |
| `src/worker/config/validation.ts:92` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/config/validation.ts:94` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/middleware/auth.ts:9` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/middleware/auth.ts:12` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/middleware/auth.ts:15` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/middleware/auth.ts:67` | Authorization/Bearer, JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/middleware/auth.ts:98` | Authorization/Bearer, JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/middleware/auth.ts:100` | Authorization/Bearer | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/middleware/auth.ts:120` | Authorization/Bearer | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/middleware/auth.ts:124` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/middleware/auth.ts:153` | Authorization/Bearer | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/middleware/auth.ts:155` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/routes/auth.ts:468` | Authorization/Bearer | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/routes/auth.ts:472` | Authorization/Bearer | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/routes/auth.ts:580` | resetToken | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/routes/auth.ts:594` | resetToken | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/routes/auth.ts:773` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/routes/auth.ts:1073` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/routes/health.ts:7` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/services/email.ts:95` | Authorization/Bearer | SAFE | Server-to-provider Authorization; no provider secret or session credential persisted in browser. |
| `src/worker/types.ts:56` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:1` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:61` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:89` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:108` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:113` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:115` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:116` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:125` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:128` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:131` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:134` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `src/worker/utils/jwt.ts:139` | JWT | SAFE | Unchanged server-only JWT config/helpers or legacy guest/reset/development transport; normal production web sessions remain D1-authoritative cookies. |
| `tests/integration/auth-hardening.test.ts:24` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:135` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:330` | Authorization/Bearer | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:331` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:332` | Authorization/Bearer | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:341` | Authorization/Bearer | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:343` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:345` | Authorization/Bearer | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:399` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:400` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:442` | Authorization/Bearer | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:443` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:447` | Authorization/Bearer | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:452` | Authorization/Bearer | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:495` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:512` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:523` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:645` | resetToken | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/auth-hardening.test.ts:649` | Authorization/Bearer, resetToken | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:177` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:178` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:184` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:243` | frigo_token, localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:244` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:245` | localStorage, sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:257` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:264` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:285` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:316` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:321` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:334` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:335` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:336` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:341` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/browser-security.test.ts:394` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:49` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:50` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:63` | frigo_token, localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:64` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:73` | frigo_token | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:85` | sessionToken | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:87` | sessionToken, JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:90` | frigo_token, localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:91` | localStorage, sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:115` | demo_user, demo_household | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:209` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:210` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:264` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:273` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:275` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:342` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:344` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:345` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:359` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:404` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:406` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:407` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:409` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:510` | frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:511` | frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:512` | frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:515` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:516` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:518` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:522` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:537` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:539` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:541` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:569` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:570` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:573` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:574` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:575` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:578` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:580` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:586` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:587` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:588` | localStorage, frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:594` | frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-security-integration.test.ts:595` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-ui-integration.test.tsx:64` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-ui-integration.test.tsx:65` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-ui-integration.test.tsx:66` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-ui-integration.test.tsx:67` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-ui-integration.test.tsx:68` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-ui-integration.test.tsx:337` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/frontend-ui-integration.test.tsx:338` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/scan-async-canary.test.ts:66` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/scan-async-canary.test.ts:83` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/scan-async-canary.test.ts:85` | Authorization/Bearer | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/scan-async-canary.test.ts:121` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/week-core-flow.test.ts:71` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/week-core-flow.test.ts:88` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/week-core-flow.test.ts:90` | Authorization/Bearer | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/week-core-flow.test.ts:111` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/integration/worker-cors.test.mjs:26` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/auth.test.ts:22` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/auth.test.ts:23` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/auth.test.ts:47` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/auth.test.ts:68` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/auth.test.ts:84` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/auth.test.ts:87` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:55` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:56` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:57` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:71` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:78` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:79` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:124` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:152` | frigo_token, localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:172` | frigo_token, localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:173` | localStorage, frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:174` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:175` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:176` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:181` | frigo_token, localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:182` | localStorage, frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:183` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:184` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:202` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:251` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:385` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:413` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:435` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:451` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:452` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:471` | frigo_token, localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:472` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:481` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:482` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/client-session.test.ts:483` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/config-validation.test.ts:16` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/config-validation.test.ts:76` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/config-validation.test.ts:77` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/config-validation.test.ts:79` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/frontend-services.test.ts:43` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/frontend-services.test.ts:44` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/frontend-services.test.ts:118` | frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/frontend-services.test.ts:123` | frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/frontend-services.test.ts:130` | frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/frontend-services.test.ts:136` | frigo_active_meal_plan | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/frontend-services.test.ts:158` | frigo_token | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/groq-provider.test.ts:15` | Authorization/Bearer | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/health.test.ts:27` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/health.test.ts:71` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/health.test.ts:96` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/health.test.ts:135` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/health.test.ts:167` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/health.test.ts:187` | JWT | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/scan-privacy.test.tsx:40` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/scan-privacy.test.tsx:41` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/scan-privacy.test.tsx:44` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/scan-privacy.test.tsx:45` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/scan-privacy.test.tsx:64` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/scan-privacy.test.tsx:65` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/scan-privacy.test.tsx:92` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/scan-privacy.test.tsx:93` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/sync.test.ts:38` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/sync.test.ts:39` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/sync.test.ts:145` | frigo_token | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/sync.test.ts:188` | frigo_token | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/sync.test.ts:198` | frigo_token | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/sync.test.ts:222` | frigo_token | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/week-planner.test.ts:320` | demo_household | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/week-planner.test.ts:331` | demo_household | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/week-query-sync.test.ts:75` | localStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |
| `tests/unit/week-query-sync.test.ts:76` | sessionStorage | TEST FIXTURE | Synthetic/negative regression assertion; never shipped to browser. |

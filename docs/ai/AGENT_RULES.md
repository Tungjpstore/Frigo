# Frigo AI Development Protocol

## Start every task

1. Treat repository code and `docs/ai` as the source of truth. Never rely on chat,
   prior model reasoning, Hoplite sessions, or unstated assumptions.
2. Read `MASTER_SPEC.md`, this file, `ARCHITECTURE.md`, `DOMAIN_MODEL.md`,
   `DECISIONS.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOFF.md`, then the
   active `tasks/T0N-*.md` packet. Follow links for affected subsystems.
3. Run `git status`, `git diff`, `git log --oneline -10`. Preserve others' work;
   do not reset or overwrite unrelated changes. Check task/dependency status.
4. Inspect relevant implementation, migrations, callers and tests before editing.
   Older reports contain stale deployment/repository claims: verify changing state.

## Scope and architecture

5. Work only on the active packet. Existing Week/recipe functionality is not
   evidence that all seven new tasks are complete; neither is it permission to
   build a parallel system.
6. Do not silently redesign accepted architecture. First document the problem,
   add/supersede an ADR in `DECISIONS.md`, explain compatibility/migration impact,
   then implement the smallest justified change. Ask when authorization is needed.
7. **Never modify PayOS** unless a future task explicitly authorizes it. Payment
   integrations/callbacks/webhooks, billing, checkout, settlement and payment UI
   are protected. Document discovered defects; do not fix them in these tasks.
8. Do not change unrelated authentication or production infrastructure. Preserve
   cookie sessions, tenancy guards, CSRF, optimistic inventory revisions,
   idempotent commands, scan confirmation and Week dual-write compatibility.
9. Preserve backward compatibility unless a specific change and migration are
   documented. Never rewrite applied migrations or silently delete old data.
10. Use existing TypeScript/Zod/raw D1 SQL conventions. Avoid unnecessary
    dependencies, `any`, speculative abstractions and large unrelated refactors.
11. Treat imported/AI input as untrusted. Validate explicit fields; global catalog
    write authority is not household membership. Never trust client ownership IDs.
12. Use strict unit conversion. Never assume package mass, onion weight, unknown
    nutrients/prices, or allergy safety from absent tags. Keep deterministic
    constraints outside LLMs. Persist every significant assumption/decision.

## Verification and completion

13. Add/update meaningful tests for behavior and database integrity. Preserve
    existing security/inventory/planner regressions. Do not weaken tests to pass.
14. Before completion run the relevant available gates from repository root:

    ```sh
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm check:migrations
    pnpm build
    ```

    `pnpm check` combines these; remote gates run only with explicit flags and
    authorization. Use Node >=22.13 (Node 24 verified) for `node:sqlite` tests and
    sqlite3 CLI for migration smoke. Install with `pnpm install --frozen-lockfile`.
    A changed schema also requires a local D1 apply/gate when available. UI changes
    require actual running-app interaction/appearance checks, not only static tests.
15. Never claim a check passed unless executed. Record exact commands, counts,
    failures and environment limitations; distinguish local from hosted/production.
    Investigate failing checks; never hide them to make CI green.
16. Re-read the full diff including untracked files. Check protected paths, old
    callers, indexes, migration safety and the active packet's acceptance criteria.
17. Before ending **every task**, update `CURRENT_STATE.md`, `TASK_BOARD.md`,
    `HANDOFF.md` (fixed format) and relevant ADRs. Record actual implementation,
    limitations, database state, exact verification and a precise next action.
18. Create a coherent checkpoint commit when possible. A handoff cannot contain
    its own commit hash: record a verified implementation commit, then make a
    documentation checkpoint, or clearly identify unavailable/uncommitted state.
    No important knowledge may exist only in the final agent message.
19. Do not apply remote migrations, deploy, expose private fixtures/media or use
    production credentials as a shortcut. Follow `DEPLOYMENT.md` when an operator
    separately authorizes release. Local success is not deployment evidence.
20. If blocked, leave a recoverable tree and mark the task blocked with the exact
    failing action, evidence and smallest safe next step. Do not claim completion.

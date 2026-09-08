# Frigo coding agents

The repository is the source of truth. For Recipe / Meal Planning work, start at
`docs/ai/AGENT_RULES.md` and read its required documents and active task packet
before editing. Do not infer current state from old chat or historical reports.

**Do not touch PayOS, payments, billing, checkout, or payment webhooks.** Do not
change unrelated authentication or production infrastructure. Keep existing
household isolation, inventory commands, and Week compatibility behavior intact.

Before finishing, update `docs/ai/CURRENT_STATE.md`, `TASK_BOARD.md`, and
`HANDOFF.md` with actual changes, exact executed checks, failures, and next action.

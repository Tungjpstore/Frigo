# T08 architecture decisions

## DEC-001 — Isolated foundation authority

Context: T01–T07 release reconciliation proceeds independently on main.
Decision: Only canonical T08 branch; current legacy readers/writers remain intact.
Reason: Foundation must not change existing production inventory behavior.
Alternatives: Immediate cutover/dual-write rejected as T09+ scope.
Consequences: Lots are an explicit point-in-time foundation snapshot, not live truth.
Related files: MASTER_CONTEXT.md; future T08 leaf domain/repository modules.
Related commit: Initial T08 documentation checkpoint (see git log).

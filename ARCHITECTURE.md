# ARCHITECTURE.md

> Current state of the system only. No history, no alternatives, no rationale —
> those live in `docs/decisions/`. Target: readable in 2 minutes, < ~150 lines.
> Update in the same commit as any change that alters what's written here.

## System overview
<3–6 sentences: what the components are and how data/control flows between them.>

## Component map
```
<ascii diagram or short tree of modules/services and their responsibilities>
```

## Key invariants
<The rules the code must always uphold, from PROJECT.md §3, and WHERE each is enforced.>

## Boundaries & interfaces
<Public API surface, module boundaries, what depends on what. What is
deliberately hidden from what.>

## Cross-cutting concerns
- **Errors:** <strategy>
- **Config/secrets:** <strategy>
- **Logging/observability:** <strategy>
- **Auth/security:** <strategy or "n/a because ...">

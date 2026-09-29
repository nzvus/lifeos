# Runbook: proving the architecture lint rules bite

`eslint.config.mjs` encodes ADR-0001/0002 as errors. A rule that never fires
might be misconfigured, so it is tested by planting violations. Re-run this
after upgrading `eslint-plugin-boundaries` (its config syntax changed in v7).

Plant these files, run `npx eslint` on them, expect every line to be an error,
then delete them:

| Planted in | Import / code | Expected rule |
|---|---|---|
| `src/core/x.ts` | `import { headers } from "next/headers"` | `no-restricted-imports` (core is framework-free) |
| `src/core/x.ts` | import from `@/features/...` | `boundaries/dependencies` |
| `src/features/nutrition/meals/x.tsx` | import from `@/features/nutrition/log/...` | `boundaries/dependencies` (no cross-slice) |
| same | import from `@/app/...` | `boundaries/dependencies` (no upward import) |
| same | `className="p-[13px]"` | `no-restricted-syntax` (arbitrary value) |
| same | `"#ff0000"` | `no-restricted-syntax` (hex colour) |
| same | a `div` containing the literal text "Hello world" | `react/jsx-no-literals` (text outside i18n) |
| `src/ui/x.tsx` | import from `@/core/...` | `boundaries/dependencies` |
| `src/i18n/x.ts` | import from `@/core/...` | `boundaries/dependencies` |

And one that must NOT fire: `src/features/nutrition/meals/x.tsx` importing
`./MealList` (a slice importing itself).

Last run: 2026-09-29, 9 of 9 reported, the same-slice import allowed.

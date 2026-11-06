# Delta — 2026-11-06-retire-v1

## MODIFIED
- **DT-42** v1 is retired: WHEN the export of v1 is verified against v2's (6 Nov) THEN v1's
  Vercel project is removed, v1's code leaves the repository, v2 lives at the repository root
  (`src/`, with `packages/kit` a workspace) and v1's tables are dropped on Neon branch
  `production` by him; the Neon project stays (DT-34) and v1 export files still load (DT-40).
  [PLAT-01 as amended by PROD-39; his 25 Oct pick «ok come consigli tu»]
- Paths: every «Today»/kit path written `apps/v2/…` in `product.md`, `patterns.md`,
  `domains/*.md` loses the `apps/v2/` prefix (no requirement changes meaning).

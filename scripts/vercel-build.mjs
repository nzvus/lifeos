/**
 * scripts/vercel-build.mjs — Vercel's build command (set in Vercel project
 * settings: Build Command = `node scripts/vercel-build.mjs`).
 *
 * What it does:
 *   - PREVIEW deployments (a pull request): apply migrations to that
 *     preview's own Neon database BRANCH, then build. This is ADR-0003's
 *     "rehearse every migration on a branch of production data", made the
 *     default path (ADR-0004).
 *   - PRODUCTION deployments: build only. Production is migrated solely by
 *     .github/workflows/migrate.yml, by hand, after a backup.
 *
 * Safety: migrating a preview requires BOTH VERCEL_ENV=preview (set by
 * Vercel) AND PREVIEW_DB_IS_BRANCH=true (set by you, in the Preview scope
 * only, after checking that the Neon integration gives previews their own
 * branch). If a misconfiguration ever pointed previews at the production
 * database, the second condition keeps this script from migrating it.
 */
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" }); // show output in Vercel logs

const isPreview = process.env.VERCEL_ENV === "preview";
const branchConfirmed = process.env.PREVIEW_DB_IS_BRANCH === "true";

if (isPreview && branchConfirmed) {
  console.log("[vercel-build] preview on its own Neon branch: rehearsing migrations");
  run("npx drizzle-kit migrate");
} else if (isPreview) {
  console.log(
    "[vercel-build] preview WITHOUT PREVIEW_DB_IS_BRANCH=true: skipping migrations",
  );
} else {
  console.log(
    `[vercel-build] ${process.env.VERCEL_ENV ?? "local"}: build only, no migrations`,
  );
}

run("npx next build");

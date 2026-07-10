# AGENTS.md

## Project purpose

This repository contains the public Crittenden family Spanish-learning dashboard. It displays shared Duolingo progress for Kelly, Amy, John Kelly, and Davy at:

- Production: https://crittenden-spanish-dashboard.vercel.app
- GitHub: https://github.com/kellybc/crittenden-spanish-dashboard

The site is intentionally lightweight: static HTML/CSS/JavaScript on the frontend, Vercel Functions for server-side operations, and Neon Postgres for shared data.

## Family profiles

Use these exact Duolingo usernames:

| Display name | Duolingo username |
| --- | --- |
| Kelly | `Kelly_B_C` |
| Amy | `AmyCritten3` |
| John Kelly | `jklions` |
| Davy | `Hollandlopguy` |

Do not replace usernames with Duolingo display names. Duolingo's public lookup requires the exact username.

## Important files

- `index.html`: page structure and progress-entry dialog.
- `styles.css`: complete visual design and responsive breakpoints.
- `app.js`: browser rendering, shared-data reads, and manual updates.
- `api/progress.js`: public progress reads and PIN-protected manual writes.
- `api/sync.js`: automatic Duolingo profile synchronization.
- `vercel.json`: clean URLs and the daily sync schedule.
- `package.json`: serverless Neon dependency.

## Data and API behavior

Neon Postgres stores two tables, created automatically by `api/progress.js`:

- `learners`: current XP, streak, lesson count, word count, and display metadata.
- `progress_history`: historical family XP snapshots used by the chart.

`GET /api/progress` is public because the dashboard is public.

`POST /api/progress` requires the family update PIN in the JSON body. Never hard-code or commit this PIN. It is stored in Vercel as the sensitive `UPDATE_PIN` environment variable.

`GET /api/sync` is used by Vercel Cron and requires the server-only `CRON_SECRET` bearer token. `POST /api/sync` accepts the family PIN for an authorized manual sync. Never expose `CRON_SECRET`, database URLs, or PIN values in client-side files, logs, commits, or responses.

Database credentials are provided by the Vercel Neon integration, normally through `DATABASE_URL` and `POSTGRES_URL`.

## Duolingo automation

Duolingo does not provide a supported public family-progress API. The project uses the unofficial public profile endpoint:

`https://www.duolingo.com/2017-06-30/users?username=<username>`

The daily Vercel cron runs `/api/sync` at `0 12 * * *` (approximately 7–8 AM Central, depending on daylight saving time and Vercel's Hobby scheduling window).

The sync imports:

- Spanish-course XP, not total XP across every language.
- Current account streak.

Duolingo does not reliably expose completed lesson or learned-word totals. Preserve those database values during automatic sync; they remain manually editable. Keep manual updates available as a fallback because the unofficial endpoint may change or become rate-limited.

## Local development

Install dependencies:

```powershell
npm.cmd install
```

Static-only preview:

```powershell
python -m http.server 4173
```

For functional API testing, use Vercel's local development command with development environment variables configured:

```powershell
vercel.cmd dev
```

Useful validation before committing:

```powershell
node --check app.js
node --check api/progress.js
node --check api/sync.js
git diff --check
```

Do not commit `.vercel/`, `node_modules/`, local environment files, logs, credentials, or exported production data.

## Deployment

The `main` branch deploys automatically through the connected Vercel project `crittenden-spanish-dashboard`. Verify production at the stable alias rather than a deployment-specific URL:

`https://crittenden-spanish-dashboard.vercel.app`

Environment-variable changes affect only new deployments, so redeploy after adding or rotating a Vercel secret.

## Editing guidance

- Preserve the warm green visual system, responsive layout, and no-photo family avatars unless the user requests a redesign.
- Keep the frontend framework-free unless a new requirement clearly justifies migration.
- Treat XP and streak as Duolingo-owned values; automatic synchronization may overwrite manual changes to them.
- Treat lessons and words as manually maintained values until a reliable source exists.
- Keep all public API responses limited to dashboard data; do not return database credentials, authentication secrets, email addresses, subscription details, or raw Duolingo payloads.
- Validate numeric writes as non-negative integers and retain constant-time secret comparisons.
- Design scheduled syncs to be safe if Vercel invokes them more than once.
- If changing the schema, make migrations safe for an already-populated production database rather than assuming empty tables.
- Update this file and `README.md` when architecture, usernames, deployment URLs, or operational procedures change.

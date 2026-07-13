# Vamos, Familia

A responsive family Spanish-learning dashboard designed for static hosting on Vercel and linking or embedding from Wix.

## Preview locally

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Data

Progress is shared across devices through Vercel Functions and Neon Postgres. The page requests a rate-limited Duolingo sync when it opens, offers a **Sync now** button, and refreshes every 15 minutes while open. The daily Vercel cron remains a backstop. Per-person snapshots power a Friday 8:00 AM Central movie-night challenge leaderboard while cumulative XP and daily history remain intact.

Duolingo's public profile response supplies Spanish XP and current streak, but not reliable completed-lesson, learned-word, or achievement totals. The public dashboard therefore uses only automatically sourced XP and streak metrics. The PIN-protected progress write endpoint remains available as an operational fallback, but the webpage has no manual-entry workflow.

Each sync also snapshots every course returned by Duolingo, using the stable course ID to keep Spanish, other languages, and Chess separate. The movie-night leaderboard remains Spanish-only; the all-course panel reports weekly XP for every available course.

## Deploy

Import this repository at Vercel. No build command is required; the project is a static site. Add the deployed URL to Wix as a menu link or embed it in a full-width iframe.

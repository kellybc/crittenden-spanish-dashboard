# Vamos, Familia

A responsive family Spanish-learning dashboard designed for static hosting on Vercel and linking or embedding from Wix.

## Preview locally

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Data

Progress is shared across devices through a Vercel Function and Neon Postgres. Reads are public; writes require the family PIN stored in Vercel as `UPDATE_PIN`. Tables and learner seed rows are created automatically on the first request.

## Deploy

Import this repository at Vercel. No build command is required; the project is a static site. Add the deployed URL to Wix as a menu link or embed it in a full-width iframe.

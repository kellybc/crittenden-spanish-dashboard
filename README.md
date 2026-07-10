# Vamos, Familia

A responsive family Spanish-learning dashboard designed for static hosting on Vercel and linking or embedding from Wix.

## Preview locally

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Data

The “Add update” form stores progress in the current browser using `localStorage`. This is intentionally a no-account prototype. For shared, cross-device updates, connect the same UI to Supabase or another hosted database.

## Deploy

Import this repository at Vercel. No build command is required; the project is a static site. Add the deployed URL to Wix as a menu link or embed it in a full-width iframe.

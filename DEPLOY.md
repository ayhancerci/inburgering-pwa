# Deploying (GitHub Pages)

The app is a static PWA. GitHub Actions builds it and publishes to **GitHub Pages** on every
push to `main` (see `.github/workflows/deploy.yml`). Free, automatic HTTPS, no server.

**Live URL:** https://ayhancerci.github.io/inburgering-pwa/

> Study data (progress, exam dates, quiz scores) lives in each device's browser (IndexedDB)
> and is tied to this URL. Use **Backup/Restore** in the app to move data between devices
> until cloud sync exists.

## How it deploys
Push to `main` (or **Actions → Deploy to GitHub Pages → Run workflow**). It runs
`npm ci && npm run build`, copies `index.html → 404.html` (SPA fallback for client-side
routes like `/cursus`, `/gesprekken`), and publishes `dist/`. No secrets required.

## Config notes (project Pages path)
- `vite.config.ts` sets `base: '/inburgering-pwa/'`.
- `BrowserRouter` uses `basename={import.meta.env.BASE_URL}` so routes work under the subpath.
- Audio URLs are built from `BASE_URL` (`src/lib/audio.ts`), so the MP3s resolve under the base.
- Repo is **public** (required for free Pages); Pages source = **GitHub Actions**.
- No custom domain / DNS.

> To switch to a custom domain later: set `base` back to `'/'`, router `basename` to `'/'`,
> rebuild audio paths, add a `public/CNAME` + a DNS record, and redeploy. Note: a URL change
> means saved progress on a device won't carry over (export/import via Backup/Restore).

## Install on phones
Open the URL → **Add to Home Screen** (iPhone Safari) / **Install app** (Android Chrome).

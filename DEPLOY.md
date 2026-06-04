# Deploying (GitHub Pages + custom domain)

The app is a static PWA. GitHub Actions builds it and publishes to **GitHub Pages** on every
push to `main` (see `.github/workflows/deploy.yml`). Hosting is free, HTTPS is automatic, and
there is no server to maintain or secure.

> Your study data (progress, exam dates, quiz scores) is **not** stored here — it lives in each
> device's browser (IndexedDB). Hosting only serves the app. Use **Backup/Restore** in the app
> to move data between devices until cloud sync is added.

**Live URL:** https://dutch.colport.io

## How it deploys
Push to `main` (or **Actions → Deploy to GitHub Pages → Run workflow**). The workflow runs
`npm ci && npm run build`, copies `index.html → 404.html` (SPA fallback for routes like
`/examens`, `/cursus`), and publishes `dist/`. No secrets required.

## One-time setup
1. **Repo is public** — required for free GitHub Pages. No secrets are committed
   (`gctts.key`, `*.key`, `.claude/` are gitignored; history was scanned clean).
2. **Pages source = GitHub Actions** (repo → Settings → Pages → Build and deployment → Source).
3. **Custom domain** = `dutch.colport.io`, set by the `public/CNAME` file in this repo.
4. **DNS** — in Hetzner → DNS → the `colport.io` zone, add:
   | Type | Name | Value | TTL |
   |---|---|---|---|
   | `CNAME` | `dutch` | `ayhancerci.github.io.` | default |
5. When DNS resolves, GitHub issues a TLS certificate automatically. Then tick
   **Enforce HTTPS** in Settings → Pages.

## Install on phones
Open `https://dutch.colport.io` → **Add to Home Screen** (iPhone Safari) / **Install app**
(Android Chrome).

# Deploying to your Hetzner server (auto-deploy on push)

The app is a **static site** (`dist/`). GitHub Actions builds it and rsyncs it to your
server on every push to `main` (see `.github/workflows/deploy.yml`). Your server only needs
to serve static files over HTTPS — no Node required there.

## 1. DNS
Create an `A` (and `AAAA` for IPv6) record for your subdomain → your server's IP, e.g.
`dutch.jouwdomein.nl → 1.2.3.4`.

## 2. Server: a docroot + a vhost (HTTPS + SPA fallback)
- Make a **dedicated** folder for the app, e.g. `sudo mkdir -p /var/www/dutch` (the deploy
  uses `rsync --delete`, so don't point it at a shared directory).
- Serve that folder at your subdomain **over HTTPS**, with **SPA fallback** (routes like
  `/cursus`, `/examens` must serve `index.html`). Examples:

  **Caddy** (`/etc/caddy/Caddyfile`) — automatic HTTPS:
  ```
  dutch.jouwdomein.nl {
      root * /var/www/dutch
      encode gzip
      try_files {path} /index.html
      file_server
  }
  ```

  **nginx** (with certbot for TLS):
  ```
  server {
      listen 443 ssl;
      server_name dutch.jouwdomein.nl;
      root /var/www/dutch;
      # ssl_certificate / ssl_certificate_key from certbot
      location / { try_files $uri /index.html; }
  }
  ```
  - `.mp3` is served as `audio/mpeg` by default. If `manifest.webmanifest` 404s or has the
    wrong type, add: `application/manifest+json webmanifest;` to nginx `types {}` (Caddy is fine).

## 3. Deploy SSH key (so the Action can upload)
On your Mac:
```
ssh-keygen -t ed25519 -f ~/dutch_deploy_key -N ""        # creates dutch_deploy_key (+ .pub)
ssh-copy-id -i ~/dutch_deploy_key.pub USER@SERVER_IP      # or append the .pub to the server's ~/.ssh/authorized_keys
```

## 4. GitHub secrets
Repo → **Settings → Secrets and variables → Actions → New repository secret**:
| Secret | Value |
|---|---|
| `SSH_PRIVATE_KEY` | the **contents** of `~/dutch_deploy_key` (the private key) |
| `SSH_HOST` | your server IP or hostname |
| `SSH_USER` | the SSH user (e.g. `deploy` or `root`) |
| `DEPLOY_PATH` | the docroot, e.g. `/var/www/dutch` |
| `SSH_PORT` | *(optional)* SSH port if not 22 |

## 5. Go live
Push anything to `main` (or **Actions tab → Build & deploy → Run workflow**). The workflow
builds and uploads `dist/` to your server. Until the secrets exist it just builds and skips
the upload (no error).

## 6. Install on phones
Open `https://dutch.jouwdomein.nl` → **Add to Home Screen** (iPhone Safari) / **Install app**
(Android Chrome).

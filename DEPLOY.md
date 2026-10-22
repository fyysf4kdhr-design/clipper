# KLYP — Server Setup & Deployment

KLYP is a standard Next.js 16 + PostgreSQL app. Pick one of three ways to run it in production.


## Option A — Docker Compose (recommended)

Everything — PostgreSQL, schema migrations, and the app — in one command.

```bash
cp .env.example .env       # optional; sane defaults are baked in
docker compose up -d --build
```

Then open **http://localhost:3000**.

What the stack does:

| Service   | What it does                                                        |
| --------- | ------------------------------------------------------------------- |
| `db`      | PostgreSQL 16 (alpine) with a persistent `pgdata` volume            |
| `migrate` | One-shot `drizzle-kit push` once the DB is healthy, then exits      |
| `app`     | Next.js standalone server (multi-stage build, non-root, healthchecked) |

Useful commands:

```bash
docker compose logs -f app     # app logs
docker compose ps              # health status
docker compose down            # stop (keeps DB volume)
docker compose down -v         # stop + wipe the database
```

The app listens on `APP_PORT` (default 3000); the DB is exposed on `DB_PORT` (5432) for tools — remove that `ports:` block if you don't need external DB access.


## Option B — Bare-metal VPS (PM2 or systemd)

Tested shape for Ubuntu/Debian with Node 20+ and PostgreSQL running locally.

```bash
git clone <your-repo> /opt/klyp && cd /opt/klyp
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh --pm2     # installs deps, pushes schema, builds, starts under PM2
```

The script is idempotent — re-run it on every deploy.

**Process managers** (configs included in `deploy/`):

```bash
# PM2
pm2 start deploy/ecosystem.config.cjs
pm2 save && pm2 startup           # survive reboots

# or systemd (no PM2)
sudo cp deploy/klyp.service /etc/systemd/system/klyp.service
sudo systemctl enable --now klyp
```

**Reverse proxy** (recommended): `deploy/nginx.conf` proxies port 80 → 3000 with sane cache rules for `/_next/static`, brand icons, and the service worker. Terminate TLS with certbot:

```bash
sudo certbot --nginx -d klyp.example.com
```


## Option C — Platform-as-a-Service

Any Node host that supports `npm run build && npm start` plus a `DATABASE_URL` works (Railway, Render, Fly.io, etc.). Set the env var, provision a Postgres addon, and run `npx drizzle-kit push` once.


## Environment variables

| Variable                | Required | Purpose                                                        |
| ----------------------- | -------- | -------------------------------------------------------------- |
| `DATABASE_URL`          | ✅       | PostgreSQL connection string                                    |
| `TIKTOK_CLIENT_KEY`     | optional | TikTok OAuth client key for live publishing                     |
| `TIKTOK_CLIENT_SECRET`  | optional | TikTok OAuth client secret                                      |
| `RENDER_BASE_URL`       | optional | Public base URL of a clip renderer for live uploads             |
| `PORT` / `HOSTNAME`     | optional | Listen address (defaults `3000` / `0.0.0.0`)                    |

TikTok publishing stays unavailable until API credentials and a public MP4 renderer are configured. Uploads are never simulated.

---

## Operations cheat sheet

- **Healthcheck**: `GET /api/health` (used by Docker, PM2 not needed)
- **PWA**: the app is installable and registers `/sw.js`; serve over HTTPS
- **Backups**: it's all in Postgres — `pg_dump` or a volume snapshot of `pgdata`
- **Regenerate icons** (if you rebrand): `node scripts/gen-icons.mjs`
- **Logs**: `docker compose logs -f app` · `pm2 logs klyp` · `journalctl -u klyp -f`

## Architecture recap

```
browser (PWA) ──► nginx :443 ──► next start :3000 ──► postgresql :5432
                                   │
                                   ├─ /api/projects      clip pipeline
                                   ├─ /api/publish       TikTok queue
                                   └─ /api/integrations  OAuth (live mode)
```
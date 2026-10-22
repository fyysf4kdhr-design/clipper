#!/usr/bin/env bash
# KLYP bare-metal server bootstrap (Debian/Ubuntu-flavored VPS).
# Idempotent — safe to re-run on every deploy.
#
#   chmod +x scripts/setup-server.sh
#   ./scripts/setup-server.sh [--pm2]
#
set -euo pipefail
cd "$(dirname "$0")/.."

USE_PM2=0
[ "${1:-}" = "--pm2" ] && USE_PM2=1

log() { printf "\033[1;92m▸\033[0m %s\n" "$1"; }
warn() { printf "\033[1;93m⚠\033[0m %s\n" "$1"; }

# ---- 1. Node.js ----
if ! command -v node >/dev/null 2>&1; then
  warn "Node.js not found — install Node 20+ first:"
  echo "    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
  echo "    sudo apt-get install -y nodejs"
  exit 1
fi
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 20 ]; then
  warn "Node $NODE_MAJOR detected — KLYP needs Node 20+."
  exit 1
fi
log "Node $(node -v) ✓"

# ---- 2. Environment ----
if [ ! -f .env ]; then
  cp .env.example .env
  warn "created .env from .env.example — edit DATABASE_URL before going live"
fi
set -a; # export everything from .env for drizzle-kit
# shellcheck disable=SC1091
. ./.env
set +a
log "environment loaded ✓"

# ---- 3. Dependencies ----
log "installing dependencies (npm ci)…"
npm ci --no-audit --no-fund

# ---- 4. Database schema ----
if command -v pg_isready >/dev/null 2>&1 && ! pg_isready -q -t 3; then
  warn "PostgreSQL is not reachable yet — skipping schema push."
  warn "run 'npx drizzle-kit push --force' once your DB is up."
else
  log "pushing database schema (drizzle-kit)…"
  npx drizzle-kit push --force || warn "schema push failed — check DATABASE_URL"
fi

# ---- 5. Production build ----
log "building (next build)…"
npm run build

# ---- 6. Serve ----
if [ "$USE_PM2" = "1" ]; then
  if ! command -v pm2 >/dev/null 2>&1; then
    log "installing pm2…"
    npm install -g pm2
  fi
  pm2 start deploy/ecosystem.config.cjs --update-env
  pm2 save
  log "KLYP is running under pm2 → pm2 status | pm2 logs klyp"
else
  log "done. start the server with:  npm start   (or re-run with --pm2)"
fi

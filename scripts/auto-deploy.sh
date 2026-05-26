#!/usr/bin/env bash
set -Eeuo pipefail

# aaPanel deployment config
PROJECT_DIR="/www/wwwroot/skymobile"
BRANCH="main"
API_PORT="3006"
PM2_APP_NAME="skymobile-api"
DEPLOY_USER="www"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

run_as_deploy_user() {
  if [ "$(id -un)" = "$DEPLOY_USER" ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo -u "$DEPLOY_USER" "$@"
  else
    su -s /bin/bash "$DEPLOY_USER" -c "$(printf '%q ' "$@")"
  fi
}

main() {
  log "------------------------------------------"
  log "🚀 Starting Sky Mobile deployment"
  log "Runtime user: $(id -un) ($(id -u))"
  log "Target deploy user: ${DEPLOY_USER}"
  log "Project dir: ${PROJECT_DIR}"
  log "------------------------------------------"

  if [ ! -d "$PROJECT_DIR/.git" ]; then
    log "❌ Git project not found at ${PROJECT_DIR}"
    exit 1
  fi

  cd "$PROJECT_DIR"

  # If the webhook/aaPanel invokes this script as root, keep files and PM2 owned by www.
  # If it invokes as www, this block is skipped and deploy runs directly as www.
  if [ "$(id -u)" = "0" ]; then
    log "🔐 Running as root: preparing ownership for ${DEPLOY_USER}:${DEPLOY_USER}"
    chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$PROJECT_DIR"
  fi

  log "📥 Resetting code to origin/${BRANCH}..."
  run_as_deploy_user git fetch origin "$BRANCH"
  run_as_deploy_user git reset --hard "origin/${BRANCH}"

  log "📦 Installing dependencies..."
  if [ -f package-lock.json ]; then
    run_as_deploy_user npm ci --include=dev
  else
    run_as_deploy_user npm install --include=dev
  fi

  log "🏗️ Building frontend assets..."
  run_as_deploy_user npm run build

  log "🧪 Type-checking project..."
  run_as_deploy_user npm run lint

  log "🧹 Releasing API port ${API_PORT} if needed..."
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${API_PORT}/tcp" 2>/dev/null || true
  else
    log "⚠️ fuser not found; skipping port cleanup."
  fi

  log "🔄 Restarting PM2 app ${PM2_APP_NAME} as ${DEPLOY_USER}..."
  run_as_deploy_user pm2 delete "$PM2_APP_NAME" >/dev/null 2>&1 || true
  run_as_deploy_user pm2 start npm --name "$PM2_APP_NAME" -- run api
  run_as_deploy_user pm2 save

  log "📋 PM2 status:"
  run_as_deploy_user pm2 list

  log "✅ Deployment successful."
  log "------------------------------------------"
}

main "$@"

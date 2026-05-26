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

run_npm_with_dev_deps() {
  run_as_deploy_user env \
    NODE_ENV=development \
    NPM_CONFIG_PRODUCTION=false \
    npm_config_production=false \
    npm_config_omit= \
    npm_config_include=dev \
    npm_config_bin_links=true \
    npm_config_ignore_scripts=false \
    npm "$@"
}

ensure_node_bin() {
  local package_name="$1"
  local bin_path="$2"

  if [ -x "node_modules/.bin/${package_name}" ]; then
    return 0
  fi

  if [ -f "$bin_path" ]; then
    log "⚠️ node_modules/.bin/${package_name} is missing; using ${bin_path} directly."
    return 0
  fi

  log "⚠️ Missing ${package_name} binary after npm install. Reinstalling dependencies with bin-links enabled..."
  run_as_deploy_user rm -rf node_modules
  if [ -f package-lock.json ]; then
    run_npm_with_dev_deps ci --include=dev --bin-links=true
  else
    run_npm_with_dev_deps install --include=dev --bin-links=true
  fi

  if [ ! -x "node_modules/.bin/${package_name}" ] && [ ! -f "$bin_path" ]; then
    log "❌ ${package_name} is still missing after reinstall. Check npm config, package-lock, and server disk permissions."
    run_as_deploy_user npm config list || true
    exit 1
  fi
}

run_node_bin() {
  local package_name="$1"
  local fallback_path="$2"
  shift 2

  if [ -x "node_modules/.bin/${package_name}" ]; then
    run_as_deploy_user "./node_modules/.bin/${package_name}" "$@"
  else
    run_as_deploy_user node "$fallback_path" "$@"
  fi
}

resolve_node_bin_for_pm2() {
  local package_name="$1"
  local fallback_path="$2"

  if [ -x "node_modules/.bin/${package_name}" ]; then
    printf './node_modules/.bin/%s' "$package_name"
  elif [ -f "$fallback_path" ]; then
    printf '%s' "$fallback_path"
  else
    log "❌ Cannot find ${package_name} binary for PM2."
    exit 1
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
  local before_head=""
  before_head="$(git rev-parse HEAD 2>/dev/null || true)"
  run_as_deploy_user git fetch origin "$BRANCH"
  run_as_deploy_user git reset --hard "origin/${BRANCH}"
  local after_head=""
  after_head="$(git rev-parse HEAD 2>/dev/null || true)"

  # Bash may continue executing the old in-memory script after git reset updates this file.
  # Re-exec once so deployment always uses the latest auto-deploy.sh from the freshly pulled code.
  if [ "${SKYMOBILE_DEPLOY_REEXECED:-0}" != "1" ] && [ -n "$before_head" ] && [ -n "$after_head" ] && [ "$before_head" != "$after_head" ]; then
    log "🔁 Code changed ${before_head} -> ${after_head}; reloading latest deploy script..."
    export SKYMOBILE_DEPLOY_REEXECED=1
    exec bash "$0" "$@"
  fi

  log "📦 Installing dependencies..."
  log "npm version: $(run_as_deploy_user npm --version)"
  log "node version: $(run_as_deploy_user node --version)"
  log "npm omit config: $(run_as_deploy_user npm config get omit 2>/dev/null || true)"
  log "npm bin-links config: $(run_as_deploy_user npm config get bin-links 2>/dev/null || true)"

  if [ -f package-lock.json ]; then
    run_npm_with_dev_deps ci --include=dev --bin-links=true
  else
    run_npm_with_dev_deps install --include=dev --bin-links=true
  fi

  ensure_node_bin "vite" "node_modules/vite/bin/vite.js"
  ensure_node_bin "tsc" "node_modules/typescript/bin/tsc"
  ensure_node_bin "tsx" "node_modules/tsx/dist/cli.mjs"

  log "🏗️ Building frontend assets..."
  run_node_bin "vite" "node_modules/vite/bin/vite.js" build

  log "🧪 Type-checking project..."
  run_node_bin "tsc" "node_modules/typescript/bin/tsc" --noEmit

  log "🧹 Releasing API port ${API_PORT} if needed..."
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${API_PORT}/tcp" 2>/dev/null || true
  else
    log "⚠️ fuser not found; skipping port cleanup."
  fi

  log "🔄 Restarting PM2 app ${PM2_APP_NAME} as ${DEPLOY_USER}..."
  local tsx_bin=""
  tsx_bin="$(resolve_node_bin_for_pm2 "tsx" "node_modules/tsx/dist/cli.mjs")"

  run_as_deploy_user pm2 delete "$PM2_APP_NAME" >/dev/null 2>&1 || true
  if [ -x "$tsx_bin" ]; then
    run_as_deploy_user pm2 start "$tsx_bin" --name "$PM2_APP_NAME" --cwd "$PROJECT_DIR" -- src/server/server.ts
  else
    run_as_deploy_user pm2 start node --name "$PM2_APP_NAME" --cwd "$PROJECT_DIR" -- "$tsx_bin" src/server/server.ts
  fi
  run_as_deploy_user pm2 save

  log "📋 PM2 status:"
  run_as_deploy_user pm2 list

  log "✅ Deployment successful."
  log "------------------------------------------"
}

main "$@"

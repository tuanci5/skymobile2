#!/bin/bash

# Đường dẫn project trên aaPanel (Khớp với hướng dẫn của bạn)
PROJECT_DIR="/www/wwwroot/skymobile"
API_PORT="3006"
PM2_APP_NAME="skymobile-api"
DEPLOY_USER="www"

# Nếu webhook/terminal gọi script bằng root, chuyển sang user www để dist/node_modules không bị owner root.
if [ "$(id -u)" = "0" ]; then
  echo "🔐 Fixing ownership for ${DEPLOY_USER}:${DEPLOY_USER} before deploy..."
  chown -R ${DEPLOY_USER}:${DEPLOY_USER} "$PROJECT_DIR"
  chmod -R u+rwX,g+rwX "$PROJECT_DIR"

  echo "🔁 Re-running deployment as ${DEPLOY_USER} user..."
  exec su -s /bin/bash ${DEPLOY_USER} -c "cd $PROJECT_DIR && bash scripts/auto-deploy.sh"
fi

echo "------------------------------------------"
echo "🚀 Starting Deployment: $(date)"
echo "------------------------------------------"

cd $PROJECT_DIR || { echo "❌ Directory not found"; exit 1; }

# 1. Pull code mới nhất từ GitHub
echo "📥 Pulling latest code from main branch..."
git pull origin main

# 2. Cài đặt các gói phụ thuộc mới (nếu có)
echo "📦 Installing dependencies..."
npm install --include=dev

# 3. Build lại Frontend (React/Vite)
echo "🏗️ Building frontend assets..."
./node_modules/.bin/vite build

# 4. Dừng API cũ đang chiếm port trước khi restart PM2
# Tránh lỗi: EADDRINUSE address already in use 0.0.0.0:3006
echo "🧹 Killing old API process on port ${API_PORT}..."
fuser -k ${API_PORT}/tcp 2>/dev/null || true

# 5. Khởi động lại Backend bằng PM2
echo "🔄 Restarting PM2 process (${PM2_APP_NAME})..."
pm2 delete ${PM2_APP_NAME} 2>/dev/null || true
NPM_BIN="$(command -v npm)"
echo "Using npm: ${NPM_BIN}"
pm2 start "$NPM_BIN" --name ${PM2_APP_NAME} -- run api
pm2 list
pm2 save

echo "------------------------------------------"
echo "✅ Deployment Successful!"
echo "------------------------------------------"

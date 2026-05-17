#!/bin/bash

# Đường dẫn project trên aaPanel (Khớp với hướng dẫn của bạn)
PROJECT_DIR="/www/wwwroot/skymobile"
API_PORT="3006"
PM2_APP_NAME="skymobile-api"
DEPLOY_USER="www"


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
echo "🔄 Starting PM2 process (${PM2_APP_NAME}) directly with tsx..."
pm2 delete ${PM2_APP_NAME} 2>/dev/null || true
pm2 start ./node_modules/.bin/tsx --name ${PM2_APP_NAME} --cwd "$PROJECT_DIR" -- src/server/server.ts
echo "⏳ Waiting 10 seconds for the application to fully start..."
sleep 10
pm2 list
pm2 save

# 6. Sửa lại quyền sở hữu cho user www để Nginx có thể truy cập các file tĩnh
if [ "$(id -u)" = "0" ]; then
  echo "🔐 Fixing ownership for ${DEPLOY_USER}:${DEPLOY_USER}..."
  chown -R ${DEPLOY_USER}:${DEPLOY_USER} "$PROJECT_DIR"
  chmod -R u+rwX,g+rwX "$PROJECT_DIR"
fi

echo "------------------------------------------"
echo "✅ Deployment Successful!"
echo "------------------------------------------"

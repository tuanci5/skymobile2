#!/bin/bash

# Đường dẫn project trên aaPanel (Khớp với hướng dẫn của bạn)
PROJECT_DIR="/www/wwwroot/skymobile"
API_PORT="3006"
PM2_APP_NAME="skymobile-api"

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
echo "🧹 Checking and freeing API port ${API_PORT}..."
if command -v fuser >/dev/null 2>&1; then
  fuser -k ${API_PORT}/tcp 2>/dev/null || true
else
  PORT_PIDS=$(lsof -ti tcp:${API_PORT} 2>/dev/null || true)
  if [ -n "$PORT_PIDS" ]; then
    echo "Killing processes on port ${API_PORT}: $PORT_PIDS"
    kill -9 $PORT_PIDS 2>/dev/null || true
  else
    echo "No process found on port ${API_PORT}."
  fi
fi

# 5. Khởi động lại Backend bằng PM2
echo "🔄 Restarting PM2 process (${PM2_APP_NAME})..."
pm2 delete ${PM2_APP_NAME} 2>/dev/null || true
pm2 start npm --name ${PM2_APP_NAME} -- run start
pm2 save

echo "------------------------------------------"
echo "✅ Deployment Successful!"
echo "------------------------------------------"

#!/bin/bash

# Đường dẫn project trên aaPanel (Khớp với hướng dẫn của bạn)
PROJECT_DIR="/www/wwwroot/skymobile"

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

# 4. Khởi động lại Backend bằng PM2
echo "🔄 Restarting PM2 process (skymobile-api)..."
# Thử restart, nếu chưa tồn tại thì start mới
pm2 restart skymobile-api || pm2 start "npm run start" --name skymobile-api

echo "------------------------------------------"
echo "✅ Deployment Successful!"
echo "------------------------------------------"

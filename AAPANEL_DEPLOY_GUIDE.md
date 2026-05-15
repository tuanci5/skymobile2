# 🚀 Hướng dẫn Triển khai & Tự động hóa Sky Mobile trên aaPanel

Tài liệu này hướng dẫn cách cài đặt mới từ đầu và thiết lập hệ thống tự động cập nhật (Auto-Deploy) qua GitHub Webhook.

---

## 1. Chuẩn bị trên Server (SSH)

### A. Tạo Website và Dọn dẹp
1. Vào aaPanel -> **Website** -> **Add site** (Ví dụ: `skymobile.movads.vn`).
2. SSH vào server và dọn dẹp các file mặc định của aaPanel để tránh lỗi khi clone:
   ```bash
   cd /www/wwwroot/skymobile
   chattr -i .user.ini  # Mở khóa file hệ thống
   rm -rf ./*
   rm -rf ./.*
   ```

### B. Tải Code về
```bash
git clone https://github.com/tuanci5/skymobile2.git .
```

---

## 2. Thiết lập Môi trường & Quyền hạn (Cực kỳ quan trọng)

Để hệ thống Webhook hoạt động, toàn bộ thư mục dự án phải thuộc về user **`www`**.

1. **Chuyển quyền sở hữu:**
   ```bash
   chown -R www:www /www/wwwroot/skymobile
   ```

2. **Cài đặt thư viện bằng quyền www:**
   ```bash
   # Sửa quyền thư mục cache cho npm
   chown -R www:www /www/server/nodejs/cache
   
   # Cài đặt (bao gồm cả devDependencies để build)
   sudo -u www npm install --include=dev
   ```

3. **Cấu hình Git an toàn:**
   ```bash
   git config --global --add safe.directory /www/wwwroot/skymobile
   ```

---

## 3. Chạy dự án bằng PM2

Chạy backend bằng user `www` để đồng bộ với Webhook:

```bash
# Xóa process cũ nếu có
pm2 delete skymobile-api

# Chạy mới bằng user www
sudo -u www bash -c "cd /www/wwwroot/skymobile && npm run build && pm2 start 'npm run start' --name skymobile-api"

# Lưu lại trạng thái
sudo -u www pm2 save
pm2 startup # Làm theo hướng dẫn hiện ra trên màn hình
```

---

## 4. Thiết lập Webhook & Tự động Deploy

### A. Cấu hình Scripts
Đảm bảo bạn có 2 file sau trong thư mục `scripts/`:

1.  **`scripts/auto-deploy.sh`**:
    *   Cấp quyền thực thi: `chmod +x /www/wwwroot/skymobile/scripts/auto-deploy.sh`
    *   Sử dụng lệnh build trực tiếp: `./node_modules/.bin/vite build` để tránh lỗi "command not found".

2.  **`scripts/webhook.php`**:
    *   Sử dụng mã Secret khớp với GitHub (Ví dụ: `skymobile_secret_123`).

### B. Cấu hình Nginx (URL Rewrite)
Trong aaPanel, vào mục **URL Rewrite** của Website và dán cấu hình sau:

```nginx
# Ưu tiên chạy giao diện từ thư mục dist
location / {
    root /www/wwwroot/skymobile/dist;
    index index.html;
    try_files $uri $uri/ /index.html;
}

# Cho phép chạy Webhook từ thư mục scripts
location ^~ /scripts/ {
    root /www/wwwroot/skymobile;
    location ~ \.php$ {
        include enable-php-83.conf; # Sửa đúng bản PHP bạn dùng (80, 81, 83...)
    }
}
```

---

## 5. Cấu hình trên GitHub

1. Vào Repo -> **Settings** -> **Webhooks** -> **Add webhook**.
2. **Payload URL:** `https://your-domain.com/scripts/webhook.php`
3. **Content type:** `application/json`
4. **Secret:** `skymobile_secret_123`
5. Nhấn **Add webhook**. Kiểm tra tab **Recent Deliveries**, nếu hiện tích xanh là thành công.

---

## 6. Xử lý các lỗi thường gặp

*   **`vite: command not found`**: 
    *   Đảm bảo đã chạy `npm install --include=dev`.
    *   Trong file `.sh` hãy dùng đường dẫn `./node_modules/.bin/vite build`.
*   **Không thấy log deploy:** 
    *   Kiểm tra mục **Disabled functions** trong cấu hình PHP của aaPanel, xóa bỏ hàm `shell_exec` và `exec`.
    *   Kiểm tra quyền ghi thư mục `scripts` (`chown -R www:www`).
*   **`.user.ini: Operation not permitted`**: 
    *   Dùng lệnh `chattr -i .user.ini` để mở khóa trước khi xóa hoặc đổi tên.

---
*Chúc bạn triển khai thành công!*

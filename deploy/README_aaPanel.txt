# Hướng dẫn chi tiết triển khai lên aaPanel (skymobile.movads.vn)

Tất cả các file cần thiết đã được chuẩn bị sẵn trong thư mục `deploy/` và `dist/` trên máy tính của bạn.

## Bước 1: Chuẩn bị file
1.  Nén thư mục `dist` (Frontend) thành file `frontend.zip`.
2.  Nén toàn bộ nội dung trong thư mục `deploy/backend` (bao gồm `src`, `package.json`, `.env.local`) thành file `backend.zip`.

## Bước 2: Triển khai Backend trên aaPanel
1.  Vào aaPanel -> **Files**. Tạo thư mục `/www/wwwroot/skymobile-api`.
2.  Upload `backend.zip` vào đó và giải nén.
3.  Vào aaPanel -> **Node.js Manager**.
    - Nhấn **Add Project**.
    - **Project Path**: Chọn thư mục bạn vừa giải nén.
    - **Run Command**: `npm run api`.
    - **Port**: `3001`.
    - Đợi một lát để nó tự cài đặt `node_modules` và báo "Running".

## Bước 3: Triển khai Website Frontend
1.  Vào aaPanel -> **Website** -> **Add site**.
    - Domain: `skymobile.movads.vn`.
    - Document Root: Trỏ vào thư mục trang web mới tạo.
2.  Upload và giải nén `frontend.zip` vào thư mục gốc của Website này.
3.  **Cấu hình Reverse Proxy**:
    - Vào cài đặt của Website `skymobile.movads.vn` -> **Reverse Proxy**.
    - Nhấn **Add reverse proxy**.
    - **Proxy name**: `api_proxy`.
    - **Target URL**: `http://127.0.0.1:3001`.
    - **Sent Domain**: `$host`.
    - Nhấn **Confirm**.

## Bước 4: Kiểm tra
1.  Truy cập `https://skymobile.movads.vn`.
2.  Mọi thứ sẽ hoạt động ngay lập tức vì Backend gọi trực tiếp vào MySQL qua `127.0.0.1`.

---
*Lưu ý: Đảm bảo port 3001 đã được mở (Allow) trong mục Security của aaPanel.*

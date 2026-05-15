# Sky Mobile

Ứng dụng gồm frontend Vite/React và backend Express API trong cùng một codebase.

## Cấu trúc chính

```txt
src/
├─ main.tsx              # Frontend entry
├─ App.tsx
├─ pages/
├─ components/
├─ services/
└─ server/               # Backend API duy nhất
   ├─ server.ts
   ├─ db.ts
   ├─ migrate.ts
   ├─ seed.ts
   ├─ fbMessenger.ts
   └─ routes/
```

> [!IMPORTANT]
> Backend source chuẩn nằm tại `src/server`. Không chạy build/backend từ `deploy/backend` nữa.

## Run locally

**Prerequisites:** Node.js

1. Cài dependencies:

   ```bash
   npm install
   ```

2. Cấu hình `.env.local` tại root project.

3. Chạy frontend:

   ```bash
   npm run dev
   ```

4. Chạy backend API:

   ```bash
   npm run api
   ```

   Mặc định API chạy port `3006` nếu không set biến `PORT`.

## Scripts

```bash
npm run dev          # Frontend Vite, port 3000
npm run api          # Backend Express API
npm run api:migrate  # Migration dữ liệu/schema
npm run api:seed     # Seed user/role mặc định
npm run build        # Build frontend production
npm run preview      # Preview frontend build
npm run lint         # TypeScript check
```

## Deploy backend với PM2

Chạy từ root project:

```bash
pm2 start npm --name skymobile-api -- run api
```

## Deploy frontend

Build frontend từ root project:

```bash
npm run build
```

Output nằm trong `dist/`.

# STU Web (Link4Sub 2.0)

Giao diện web Next.js App Router của STU platform. API, worker, hạ tầng và tài liệu
hệ thống nằm ở repo riêng **stu-api**.

## Cấu trúc

```text
src/
  app/          route, layout, loading/error boundary
  features/     UI và logic theo nghiệp vụ
  components/   UI dùng chung (components/ui: primitive)
  lib/          adapter hạ tầng, auth, API client
  config/       đọc biến môi trường (server.ts, public.ts)
  contracts/    bản sao kiểu dùng chung từ stu-api (không sửa tay)
messages/       chuỗi i18n vi, en, id
scripts/        sync-file-icons, sync-contracts, i18n-audit
patches/        patch cho dependency (pnpm patchedDependencies)
docs/design.md  hướng dẫn thiết kế UI (light/dark)
Dockerfile      image production (Next.js standalone)
```

## Chạy local

Yêu cầu Node >= 20, pnpm 10 (`corepack enable`) và API stu-api đang chạy.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Kiểu dùng chung với API

`src/contracts` là bản sao từ `src/contracts` của stu-api. Khi API đổi contracts:

```bash
pnpm contracts:check    # báo file lệch
pnpm contracts:sync     # chép lại từ ../stu-api (đổi bằng CONTRACTS_SOURCE)
```

## Deploy bằng Dokploy

Dùng `compose.dokploy.yml` (service **Docker Compose**) hoặc tạo Application từ
`Dockerfile`. Biến bắt buộc: `WEB_URL`, `API_URL` (địa chỉ API mà server Next.js
gọi tới) và `INTERNAL_API_SECRET` (trùng với stu-api).

## Kiểm tra trước khi merge

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

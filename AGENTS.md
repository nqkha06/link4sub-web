# Hướng dẫn cho agent

Repo này là giao diện web của STU platform (Link4Sub 2.0); API ở repo stu-api.
Đọc `README.md` để nắm cấu trúc, `docs/design.md` trước khi đổi UI.

## Nguyên tắc chung

- Package manager là pnpm 10 (`packageManager` trong `package.json`). Không dùng npm/yarn.
- Mỗi thay đổi phải qua `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Commit nhỏ, theo Conventional Commits (`feat(scope): ...`, `fix(...)`, `chore(...)`).
- Không commit `.env*` (trừ `.env.example`).
- Không tạo file nháp, ảnh chụp màn hình, bản backup hay thư mục output ở root repo.

## Biên module

- Không import source, DTO hay Prisma model của API. Kiểu dùng chung nằm trong
  `src/contracts`, là bản sao từ stu-api: không sửa tay, dùng `pnpm contracts:sync`.
- Route trong `src/app`, nghiệp vụ trong `src/features/<domain>`,
  UI dùng chung trong `src/components`, adapter hạ tầng trong `src/lib`.
- JSON API trả `ApiResponse<T>` / `PaginatedApiResponse<T>`; chỉ parse envelope ở API layer.

## Cấu hình

- Chỉ đọc biến môi trường trong `src/config/{server,public}.ts`.
  Code nghiệp vụ nhận object config đã parse, không đọc `process.env`.
- Thêm biến mới thì cập nhật `.env.example`.
- Không đặt secret trong `NEXT_PUBLIC_*`.

## Test

- `node --test`, file `*.test.ts` đặt cạnh code; thêm vào script `test` của `package.json`.

## UI

- Theo `docs/design.md`: semantic token (`bg-background`, `text-foreground`, ...),
  light/dark ngang nhau, không hard-code màu theo theme.
- Ưu tiên primitive có sẵn trong `src/components/ui`.
- Chuỗi hiển thị đi qua i18n (`messages/{vi,en,id}.json`).

/**
 * Chuẩn ô nhập liệu cho khu thành viên: mọi Input / Select / Textarea / ô ghép
 * dùng chung một chiều cao, cỡ chữ, viền, bo góc, nền. Component gốc trong
 * `components/ui` (dùng chung với admin) giữ nguyên; khu thành viên import từ
 * `@/components/member/fields/*` để nhận chuẩn này.
 *
 * - Cao 40px (h-10), bo 8px (rounded-lg), viền màu border, nền background, không bóng.
 * - Chữ 16px trên mobile (tránh iOS tự zoom), 14px từ md.
 */

/** Input, SelectTrigger, InputGroup. */
export const MEMBER_FIELD_CONTROL =
  "h-10 rounded-lg border-border bg-background text-base shadow-none md:text-sm"

/** Textarea: cùng viền/nền/chữ, chiều cao tuỳ nội dung (min-h đặt ở nơi dùng). */
export const MEMBER_FIELD_TEXTAREA =
  "rounded-lg border-border bg-background px-3 py-2 text-base shadow-none md:text-sm"

/**
 * Khung của ô ghép (icon/tiền tố + ô nhập không viền bên trong), ví dụ ô tìm
 * kiếm hoặc ô đường dẫn có "/b/" phía trước.
 */
export const MEMBER_FIELD_SHELL =
  "flex h-10 min-w-0 items-center overflow-hidden rounded-lg border border-border bg-background text-base transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 md:text-sm"

/** Ô nhập nằm trong MEMBER_FIELD_SHELL: không viền, không nền, cao theo khung. */
export const MEMBER_FIELD_BARE =
  "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 text-base shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0 dark:bg-transparent md:text-sm"

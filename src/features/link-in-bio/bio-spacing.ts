/**
 * Thang khoảng cách dùng chung cho trang bio: bản xem trước trong editor
 * (`link-in-bio-generator.tsx`) và trang công khai (`/b/[slug]`) phải dùng
 * đúng các class này để hai nơi luôn giống nhau.
 *
 * - Giữa các khối nội dung: 12px.
 * - Từ header tới khối đầu tiên: 24px.
 * - Từ khối cuối tới nút "Tạo trang của bạn": 48px.
 * - Padding ngang bên trong khối dạng thẻ (link, ngân hàng, widget): 16px.
 * - Khối không có khung (chữ, tiêu đề gallery): thụt 4px cho thẳng hàng nhau.
 */

/** Danh sách khối nội dung. */
export const BIO_CONTENT_STACK_CLASS = "mt-6 flex flex-col gap-3";

/** Khoảng cách trước nút "Tạo trang của bạn" ở cuối trang. */
export const BIO_FOOTER_CLASS = "mt-auto flex justify-center pt-12";

/** Hàng icon mạng xã hội: thêm 4px trên/dưới để tách khỏi các khối thẻ (16px thay vì 12px). */
export const BIO_SOCIAL_ROW_CLASS =
  "mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2.5 py-1";

/** Một icon mạng xã hội: 44px, đủ vùng chạm trên mobile. */
export const BIO_SOCIAL_ICON_CLASS =
  "flex size-11 items-center justify-center rounded-xl border";

/** Thụt ngang cho khối không có khung (chữ, tiêu đề gallery). */
export const BIO_BARE_BLOCK_INSET_CLASS = "px-1";

/** Header hồ sơ: avatar, tên, slug, mô tả. */
export const BIO_HEADER = {
  avatar:
    "relative mx-auto flex size-24 items-center justify-center overflow-hidden rounded-[1.75rem] bg-slate-900 text-3xl font-bold text-white",
  name: "mt-4 text-[1.75rem] font-bold leading-tight tracking-[-0.04em]",
  handle: "mt-1.5 text-[13px] font-medium",
  description: "mx-auto mt-3 max-w-[27rem] text-[14px] leading-6",
} as const;

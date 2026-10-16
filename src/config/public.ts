/**
 * Config công khai (được inline vào bundle trình duyệt). Chỉ đặt giá trị KHÔNG
 * phải secret ở đây; secret luôn nằm trong `config/server.ts`.
 */

/**
 * Google Identity Services chạy trong trình duyệt nên cần client ID công khai.
 * Đây là giá trị công khai, không phải secret. `GOOGLE_CLIENT_ID` và
 * `GOOGLE_CLIENT_SECRET` chỉ tồn tại ở stu-api để xác minh credential; stu-web
 * cần biến `NEXT_PUBLIC_` riêng vì Next.js chỉ inline biến có tiền tố này.
 */
export function getPublicGoogleClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
}

/**
 * Error tracking phía trình duyệt. DSN là định danh công khai của project (chỉ
 * cho phép gửi sự kiện), không phải secret; để trống là tắt hẳn. Next.js inline
 * các biến này lúc build nên đổi giá trị phải build lại.
 */
export function getPublicObservabilityConfig() {
  return {
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined,
    environment:
      process.env.NEXT_PUBLIC_APP_ENV?.trim() ||
      process.env.NODE_ENV ||
      "development",
    release: process.env.NEXT_PUBLIC_APP_RELEASE?.trim() || undefined,
  };
}

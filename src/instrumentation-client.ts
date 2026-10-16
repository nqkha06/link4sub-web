import * as Sentry from "@sentry/nextjs";

import { buildSentryOptions } from "@/lib/observability/sentry-options";

// Chạy một lần khi bundle trình duyệt khởi động. Không có DSN thì SDK tắt hẳn.
Sentry.init({
  ...buildSentryOptions("browser"),
  // Lỗi từ extension và script quảng cáo bên thứ ba không phải lỗi của ứng dụng.
  denyUrls: [/^chrome-extension:\/\//i, /^moz-extension:\/\//i, /^safari-web-extension:\/\//i],
  ignoreErrors: ["ResizeObserver loop limit exceeded", "ResizeObserver loop completed with undelivered notifications."],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

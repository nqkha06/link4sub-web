import * as Sentry from "@sentry/nextjs";

import { validateServerEnvironment } from "@/config/server";

// Chạy một lần khi Next.js server khởi động: thiếu biến bắt buộc thì dừng ngay
// thay vì lỗi rải rác ở từng request.
export async function register() {
  validateServerEnvironment();

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Lỗi khi render Server Component, route handler và proxy.
export const onRequestError = Sentry.captureRequestError;

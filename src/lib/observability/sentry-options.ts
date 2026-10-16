import { getPublicObservabilityConfig } from "@/config/public";

import { scrubBreadcrumb, scrubErrorEvent } from "./scrub";

/**
 * Tuỳ chọn dùng chung cho cả ba runtime (trình duyệt, Node, edge). Chỉ thu
 * lỗi: không tracing, không session replay, không tự gắn dữ liệu người dùng.
 */
export function buildSentryOptions(runtime: "browser" | "server" | "edge") {
  const config = getPublicObservabilityConfig();
  return {
    dsn: config.sentryDsn,
    enabled: Boolean(config.sentryDsn),
    environment: config.environment,
    release: config.release,
    tracesSampleRate: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
    },
    initialScope: { tags: { service: "web", runtime } },
    beforeSend: <T extends object>(event: T) => scrubErrorEvent(event),
    beforeBreadcrumb: <T extends object>(breadcrumb: T) => scrubBreadcrumb(breadcrumb),
  };
}

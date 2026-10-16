/**
 * Làm sạch sự kiện lỗi trước khi gửi ra ngoài (bản rút gọn của
 * stu-api/src/infrastructure/observability/error-scrubber.ts). Thuần, không
 * phụ thuộc SDK, chạy được ở trình duyệt, Node và edge.
 */
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*/g;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const KEY_VALUE_PATTERN =
  /\b(password|token|accessToken|refreshToken|idToken|visitToken|rawKey|authorization|cookie|secret|apiKey)\s*[:=]\s*([^\s,;&]+)/gi;
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const SENSITIVE_KEY =
  /(password|secret|token|authorization|cookie|apikey|rawkey|credential|email|phone|address|accountnumber|accountholder)/i;
const MAX_DEPTH = 6;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function scrubText(value: string) {
  return value
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(JWT_PATTERN, "[JWT]")
    .replace(KEY_VALUE_PATTERN, "$1=[REDACTED]")
    .replace(EMAIL_PATTERN, "[EMAIL]");
}

/** Bỏ query string/hash và che token dạng UUID trong đường dẫn. */
export function scrubUrl(value: string) {
  return scrubText(value.split(/[?#]/)[0] ?? "").replace(UUID_PATTERN, "[ID]");
}

export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[MAX_DEPTH]";
  if (typeof value === "string") return scrubText(value);
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => scrubValue(item, depth + 1));
  }
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 50)
      .map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key.replace(/[^a-z0-9]/gi, ""))
          ? "[REDACTED]"
          : scrubValue(item, depth + 1),
      ]),
  );
}

export function scrubBreadcrumb<T extends object>(breadcrumb: T): T {
  const source = breadcrumb as UnknownRecord;
  const data = isRecord(source.data) ? { ...source.data } : source.data;
  if (isRecord(data)) {
    for (const key of ["url", "from", "to"]) {
      if (typeof data[key] === "string") data[key] = scrubUrl(data[key]);
    }
  }
  return {
    ...source,
    message:
      typeof source.message === "string" ? scrubText(source.message) : source.message,
    data: scrubValue(data),
  } as T;
}

export function scrubErrorEvent<T extends object>(event: T): T {
  const source = event as UnknownRecord;
  const output: UnknownRecord = { ...source };

  if (isRecord(source.request)) {
    // Chỉ giữ method và URL đã bỏ query; header, cookie, body không gửi đi.
    output.request = {
      ...(typeof source.request.method === "string"
        ? { method: source.request.method }
        : {}),
      ...(typeof source.request.url === "string"
        ? { url: scrubUrl(source.request.url) }
        : {}),
    };
  }
  if (isRecord(source.user)) {
    const id = source.user.id;
    output.user =
      typeof id === "string" || typeof id === "number" ? { id } : undefined;
  }
  for (const key of ["extra", "contexts", "tags"]) {
    if (source[key] !== undefined) output[key] = scrubValue(source[key]);
  }
  if (typeof source.message === "string") output.message = scrubText(source.message);
  if (typeof source.transaction === "string") {
    output.transaction = scrubUrl(source.transaction);
  }
  if (isRecord(source.exception) && Array.isArray(source.exception.values)) {
    output.exception = {
      ...source.exception,
      values: source.exception.values.map((item: unknown) =>
        isRecord(item) && typeof item.value === "string"
          ? { ...item, value: scrubText(item.value) }
          : item,
      ),
    };
  }
  if (Array.isArray(source.breadcrumbs)) {
    output.breadcrumbs = source.breadcrumbs.map((crumb: unknown) =>
      isRecord(crumb) ? scrubBreadcrumb(crumb) : crumb,
    );
  }
  return output as T;
}

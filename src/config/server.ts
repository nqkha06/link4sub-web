/**
 * Config layer duy nhất của stu-web cho biến môi trường phía server.
 *
 * - Toàn bộ `process.env` của server nằm ở đây; code còn lại chỉ dùng
 *   `getServerConfig()`.
 * - URL nội bộ gọi NestJS (`apiInternalUrl`) KHÔNG phải biến môi trường: nó được
 *   dẫn xuất từ `API_URL` (`${API_URL}/api`).
 * - Không dùng `NEXT_PUBLIC_*` cho secret. Ở trình duyệt các biến server luôn
 *   undefined, và `getServerConfig()` chủ động throw nếu bị gọi ở đó.
 */
export type ServerEnv = Readonly<Record<string, string | undefined>>;

export type ServerConfig = {
  isProduction: boolean;
  /** Origin công khai của website. */
  webUrl: string;
  /** Origin công khai của API, đã bỏ dấu `/` cuối. */
  apiUrl: string | undefined;
  /** `${API_URL}/api` — URL Next.js server dùng để gọi NestJS. */
  apiInternalUrl: string | undefined;
  /** Secret dùng chung với stu-api để API tin header x-visitor-*. */
  internalApiSecret: string | undefined;
  /** Thư mục local bền vững chứa favicon/touch/PWA icons do Next.js tạo. */
  siteIconDir: string;
  accessCookieName: string;
  refreshCookieName: string;
  authCookiePath: string;
  authCookieDomain: string | undefined;
  authCookieSecure: boolean;
  authCookieSameSite: "lax" | "strict" | "none";
  /** Mã quốc gia dùng khi proxy không cung cấp header quốc gia. */
  defaultVisitorCountry: string;
  /**
   * Số lớp reverse proxy tin cậy đứng trước stu-web. 0 = không tin
   * `X-Forwarded-For` (xem `lib/client-ip.ts`).
   */
  trustProxyHops: number;
  /** Header chứa IP client do proxy ngoài cùng đặt, ví dụ `cf-connecting-ip`. */
  clientIpHeader: string | undefined;
};

const DEFAULT_ACCESS_COOKIE_NAME = "stu_access_token";
const DEFAULT_REFRESH_COOKIE_NAME = "stu_refresh_token";
const DEFAULT_VISITOR_COUNTRY = "VN";
const MIN_SECRET_LENGTH = 32;

function readString(env: ServerEnv, key: string) {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function readBoolean(env: ServerEnv, key: string, fallback: boolean) {
  const value = readString(env, key)?.toLowerCase();
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${key} phải là true hoặc false.`);
}

function readSameSite(env: ServerEnv) {
  const value = readString(env, "AUTH_COOKIE_SAME_SITE")?.toLowerCase() ?? "lax";
  if (value === "lax" || value === "strict" || value === "none") return value;
  throw new Error("AUTH_COOKIE_SAME_SITE phải là lax, strict hoặc none.");
}

export function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function joinUrl(base: string, path: string) {
  return `${stripTrailingSlash(base)}/${path.replace(/^\/+/, "")}`;
}

function parseHttpUrl(key: string, value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${key} phải là URL http(s) hợp lệ.`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${key} phải là URL http(s) hợp lệ.`);
  }
  return stripTrailingSlash(value);
}

/** Parse thuần từ một object env; không throw khi thiếu biến (xem `assertServerConfig`). */
export function loadServerConfig(env: ServerEnv): ServerConfig {
  const rawApiUrl = readString(env, "API_URL");
  const apiUrl = rawApiUrl ? parseHttpUrl("API_URL", rawApiUrl) : undefined;
  const webUrl = parseHttpUrl(
    "WEB_URL",
    readString(env, "WEB_URL") ?? "http://localhost:3000",
  );
  const country = (readString(env, "DEFAULT_VISITOR_COUNTRY") ?? DEFAULT_VISITOR_COUNTRY).toUpperCase();
  const authCookieSecure = readBoolean(
    env,
    "AUTH_COOKIE_SECURE",
    env.NODE_ENV === "production",
  );
  const authCookieSameSite = readSameSite(env);
  if (authCookieSameSite === "none" && !authCookieSecure) {
    throw new Error("AUTH_COOKIE_SAME_SITE=none bắt buộc AUTH_COOKIE_SECURE=true.");
  }
  if (!/^[A-Z]{2}$/.test(country)) {
    throw new Error("DEFAULT_VISITOR_COUNTRY phải là mã quốc gia ISO 2 ký tự.");
  }

  const rawHops = readString(env, "TRUST_PROXY_HOPS") ?? "0";
  const trustProxyHops = Number(rawHops);
  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 10) {
    throw new Error("TRUST_PROXY_HOPS phải là số nguyên từ 0 đến 10.");
  }
  const clientIpHeader = readString(env, "CLIENT_IP_HEADER")?.toLowerCase();
  if (clientIpHeader && !/^[a-z0-9-]+$/.test(clientIpHeader)) {
    throw new Error("CLIENT_IP_HEADER phải là tên một HTTP header hợp lệ.");
  }
  return {
    isProduction: env.NODE_ENV === "production",
    webUrl,
    apiUrl,
    apiInternalUrl: apiUrl ? joinUrl(apiUrl, "/api") : undefined,
    internalApiSecret: readString(env, "INTERNAL_API_SECRET"),
    siteIconDir: readString(env, "SITE_ICON_DIR") ?? "var/site-icons",
    accessCookieName: readString(env, "AUTH_ACCESS_COOKIE_NAME") ?? DEFAULT_ACCESS_COOKIE_NAME,
    refreshCookieName: readString(env, "AUTH_REFRESH_COOKIE_NAME") ?? DEFAULT_REFRESH_COOKIE_NAME,
    authCookiePath: readString(env, "AUTH_COOKIE_PATH") ?? "/",
    authCookieDomain: readString(env, "AUTH_COOKIE_DOMAIN"),
    authCookieSecure,
    authCookieSameSite,
    defaultVisitorCountry: country,
    trustProxyHops,
    clientIpHeader,
  };
}

/** Fail fast khi khởi động server: các biến web bắt buộc phải có. */
export function assertServerConfig(env: ServerEnv) {
  const config = loadServerConfig(env);
  if (!config.apiUrl) throw new Error("API_URL là bắt buộc.");
  if ((config.internalApiSecret?.length ?? 0) < MIN_SECRET_LENGTH) {
    throw new Error(`INTERNAL_API_SECRET phải có ít nhất ${MIN_SECRET_LENGTH} ký tự.`);
  }
  return config;
}

let cached: ServerConfig | undefined;

export function getServerConfig(): ServerConfig {
  if (typeof window !== "undefined") {
    throw new Error("Server config không được dùng trong code chạy ở trình duyệt.");
  }
  cached ??= loadServerConfig(process.env);
  return cached;
}

/** Chỉ dùng từ `instrumentation.ts`. */
export function validateServerEnvironment() {
  // `next build` không nhất thiết có đủ biến runtime; chỉ kiểm tra khi server chạy thật.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const config = assertServerConfig(process.env);
  if (config.isProduction && config.trustProxyHops === 0 && !config.clientIpHeader) {
    console.warn(
      "TRUST_PROXY_HOPS=0 và chưa đặt CLIENT_IP_HEADER: stu-web không xác định được IP " +
        "người dùng, nên API sẽ không giới hạn tốc độ cho request đi qua web.",
    );
  }
}

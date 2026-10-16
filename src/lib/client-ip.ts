import { isIP } from "node:net";

/**
 * IP của người dùng cuối nhìn từ stu-web. Chỉ tin header do reverse proxy của
 * mình đặt; header do client tự gửi không bao giờ được dùng.
 *
 * - `CLIENT_IP_HEADER` (ví dụ `cf-connecting-ip`): dùng đúng header đó. Chỉ đặt
 *   khi proxy ngoài cùng luôn ghi đè header này và web không nhận kết nối trực
 *   tiếp từ Internet.
 * - Nếu không, lấy từ `X-Forwarded-For` phần tử thứ `TRUST_PROXY_HOPS` tính từ
 *   phải sang: đó là địa chỉ mà lớp proxy tin cậy ngoài cùng nhìn thấy. Các
 *   phần tử bên trái nó do client tự khai nên bị bỏ qua.
 * - `TRUST_PROXY_HOPS=0` (mặc định): không tin header nào, trả `null`.
 */
export type ClientIpConfig = {
  trustProxyHops: number;
  clientIpHeader: string | undefined;
};

function normalizeIp(value: string | null | undefined) {
  const candidate = value?.trim().replace(/^::ffff:/i, "");
  return candidate && isIP(candidate) ? candidate : null;
}

export function pickClientIp(
  headers: Pick<Headers, "get">,
  config: ClientIpConfig,
) {
  if (config.clientIpHeader) {
    return normalizeIp(headers.get(config.clientIpHeader));
  }
  if (config.trustProxyHops <= 0) return null;

  const chain = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return normalizeIp(chain[chain.length - config.trustProxyHops]);
}

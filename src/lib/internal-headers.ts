import { getServerConfig } from "@/config/server";
import { pickClientIp } from "@/lib/client-ip";

/** IP người dùng cuối theo cấu hình proxy của stu-web; `null` nếu không tin được. */
export function resolveClientIp(headers: Pick<Headers, "get">) {
  return pickClientIp(headers, getServerConfig());
}

/**
 * Gắn IP người dùng cuối vào request mà stu-web gọi hộ sang stu-api. API chỉ
 * tin `x-visitor-ip` khi đi kèm shared secret nội bộ, nên hai header luôn đi
 * cùng nhau. Không xác định được IP thì chỉ gửi secret: API biết request đến từ
 * lớp web và không giới hạn tốc độ theo IP của máy web (vốn chung cho mọi người).
 */
export function applyClientIpHeaders(headers: Headers, clientIp: string | null | undefined) {
  const secret = getServerConfig().internalApiSecret;
  if (!secret) return;
  headers.set("x-internal-secret", secret);
  if (clientIp) headers.set("x-visitor-ip", clientIp);
}

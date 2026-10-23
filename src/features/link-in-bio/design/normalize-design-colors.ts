/**
 * API chỉ nhận màu hex (#RRGGBB hoặc #RRGGBBAA). Một số nguồn cũ (theme mẫu
 * nền) dùng `rgb()/rgba()` hoặc `#RGB` — đổi hết sang hex trước khi lưu.
 */

const HEX6_8 = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

function hex(value: number) {
  return Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0").toUpperCase();
}

/** Đổi một màu CSS sang hex; trả `null` nếu không nhận ra. */
export function toHexColor(value: string): string | null {
  const color = value.trim();
  if (HEX6_8.test(color)) return color.toUpperCase();

  const short = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i);
  if (short) return `#${short.slice(1).filter(Boolean).map((part) => part + part).join("")}`.toUpperCase();

  const rgb = color.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
  if (!rgb) return null;
  const [, r, g, b, a] = rgb;
  const alpha = a === undefined ? 1 : a.endsWith("%") ? Number.parseFloat(a) / 100 : Number.parseFloat(a);
  const base = `#${hex(Number(r))}${hex(Number(g))}${hex(Number(b))}`;
  return alpha >= 1 ? base : `${base}${hex(alpha * 255)}`;
}

/** Duyệt toàn bộ object, đổi mọi chuỗi màu không phải hex sang hex. */
export function normalizeDesignColors<T>(value: T): T {
  if (typeof value === "string") {
    if (value.startsWith("#") && !HEX6_8.test(value)) return (toHexColor(value) ?? value) as T;
    if (/^rgba?\(/i.test(value)) return (toHexColor(value) ?? value) as T;
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => normalizeDesignColors(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, normalizeDesignColors(child)]),
    ) as T;
  }
  return value;
}

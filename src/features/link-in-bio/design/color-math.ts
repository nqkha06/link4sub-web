/**
 * Chuyển đổi màu cho bộ chọn màu của Bio Studio. Giá trị lưu luôn là hex
 * in hoa `#RRGGBB` hoặc `#RRGGBBAA` (đúng định dạng schema Bio Design).
 */

export type Rgba = { r: number; g: number; b: number; a: number };
/** h: 0–360, s/v: 0–1, a: 0–1 */
export type Hsva = { h: number; s: number; v: number; a: number };
export type ColorFormat = "hex" | "rgb" | "hsl";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 0) => Number(value.toFixed(digits));

export function hexToRgba(hex: string): Rgba | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim());
  if (!match) return null;
  let body = match[1];
  if (body.length === 3) body = body.split("").map((char) => char + char).join("");
  const value = (index: number) => Number.parseInt(body.slice(index, index + 2), 16);
  return { r: value(0), g: value(2), b: value(4), a: body.length === 8 ? round(value(6) / 255, 3) : 1 };
}

export function rgbaToHex({ r, g, b, a }: Rgba, withAlpha = true): string {
  const part = (value: number) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");
  const alpha = withAlpha && a < 1 ? part(a * 255) : "";
  return `#${part(r)}${part(g)}${part(b)}${alpha}`.toUpperCase();
}

export function rgbaToHsva({ r, g, b, a }: Rgba): Hsva {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const delta = max - Math.min(red, green, blue);
  let h = 0;
  if (delta) {
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? delta / max : 0, v: max, a };
}

export function hsvaToRgba({ h, s, v, a }: Hsva): Rgba {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255, a };
}

function rgbaToHsl({ r, g, b }: Rgba) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  const delta = max - min;
  const s = delta ? delta / (1 - Math.abs(2 * l - 1)) : 0;
  const { h } = rgbaToHsva({ r, g, b, a: 1 });
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

/** Chuỗi hiển thị theo định dạng đang chọn. */
export function formatColor(rgba: Rgba, format: ColorFormat, withAlpha = true): string {
  const alpha = withAlpha && rgba.a < 1;
  if (format === "rgb") {
    const rgb = `${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}`;
    return alpha ? `rgba(${rgb}, ${round(rgba.a, 2)})` : `rgb(${rgb})`;
  }
  if (format === "hsl") {
    const { h, s, l } = rgbaToHsl(rgba);
    const hsl = `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
    return alpha ? `hsla(${hsl}, ${round(rgba.a, 2)})` : `hsl(${hsl})`;
  }
  return rgbaToHex(rgba, withAlpha);
}

/** Đọc chuỗi người dùng gõ: hex, rgb()/rgba(), hsl()/hsla(). Không hợp lệ → null. */
export function parseColor(input: string): Rgba | null {
  const text = input.trim().toLowerCase();
  const hex = hexToRgba(text);
  if (hex) return hex;
  const numbers = (text.match(/-?\d*\.?\d+%?/g) ?? []).map((part) => ({ value: Number.parseFloat(part), percent: part.endsWith("%") }));
  const alphaOf = (index: number) => {
    const part = numbers[index];
    if (!part) return 1;
    return clamp(part.percent ? part.value / 100 : part.value, 0, 1);
  };
  if (/^rgba?\(/.test(text) && numbers.length >= 3) {
    const channel = (index: number) => clamp(numbers[index].percent ? numbers[index].value * 2.55 : numbers[index].value, 0, 255);
    return { r: channel(0), g: channel(1), b: channel(2), a: alphaOf(3) };
  }
  if (/^hsla?\(/.test(text) && numbers.length >= 3) {
    const rgb = hslToRgb(((numbers[0].value % 360) + 360) % 360, clamp(numbers[1].value / 100, 0, 1), clamp(numbers[2].value / 100, 0, 1));
    return { ...rgb, a: alphaOf(3) };
  }
  return null;
}

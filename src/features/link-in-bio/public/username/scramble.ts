/** Ký tự ngẫu nhiên dùng cho hiệu ứng xáo chữ. */
export const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!<>-_\\/[]{}=+*^?#";

function randomGlyph(random: () => number) {
  return SCRAMBLE_GLYPHS[Math.floor(random() * SCRAMBLE_GLYPHS.length)];
}

/**
 * Khung hình xáo chữ tại `progress` (0–1).
 * - "sweep": giải mã lần lượt từ trái sang phải.
 * - "random": mỗi ký tự ổn định ở một thời điểm riêng (thứ tự cho trước).
 * Khoảng trắng luôn giữ nguyên.
 */
export function scrambleFrame(
  text: string,
  progress: number,
  mode: "sweep" | "random",
  order: number[] = [],
  random = Math.random,
) {
  const chars = Array.from(text);
  const clamped = Math.min(1, Math.max(0, progress));
  return chars
    .map((char, index) => {
      if (char.trim() === "") return char;
      const settleAt = mode === "sweep"
        ? (index + 1) / chars.length
        : ((order[index] ?? index) + 1) / chars.length;
      return clamped >= settleAt ? char : randomGlyph(random);
    })
    .join("");
}

/** Hoán vị ngẫu nhiên 0..n-1 (Fisher–Yates). */
export function shuffledOrder(length: number, random = Math.random) {
  const order = Array.from({ length }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  return order;
}

/** Chuỗi khung của máy đánh chữ: gõ từng ký tự rồi xoá dần, bắt đầu lại từ rỗng. */
export function typewriterText(text: string, step: number) {
  const chars = Array.from(text);
  const cycle = chars.length * 2;
  if (!cycle) return "";
  const position = ((step % cycle) + cycle) % cycle;
  const visible = position <= chars.length ? position : cycle - position;
  return chars.slice(0, visible).join("");
}

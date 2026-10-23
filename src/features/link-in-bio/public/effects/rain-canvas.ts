/**
 * Mưa vẽ bằng canvas 2D — chuyển từ `createRainEffect(canvasId, rainAmount, rainColor)`
 * của bản cũ: mỗi giọt là một vạch dọc dài 10–30px, rơi 2–7px/khung, chạm đáy
 * thì quay lại đỉnh ở vị trí ngang ngẫu nhiên.
 *
 * Khác bản cũ: canvas nét theo devicePixelRatio, tự co giãn khi đổi kích thước
 * cửa sổ, tốc độ không phụ thuộc tần số màn hình, và trả về hàm dọn dẹp.
 */

export type Raindrop = { x: number; y: number; length: number; velocityY: number };

export function createRaindrops(count: number, width: number, height: number, random = Math.random): Raindrop[] {
  return Array.from({ length: Math.max(0, Math.round(count)) }, () => ({
    x: random() * width,
    y: random() * height,
    length: random() * 20 + 10,
    velocityY: random() * 5 + 2,
  }));
}

/** Một bước mô phỏng; `frames` = số khung 60fps đã trôi qua. */
export function stepRaindrops(drops: Raindrop[], width: number, height: number, frames: number, speed: number, random = Math.random) {
  for (const drop of drops) {
    drop.y += drop.velocityY * speed * frames;
    if (drop.y > height) {
      drop.y = -drop.length;
      drop.x = random() * width;
    }
  }
}

export function startRain(
  canvas: HTMLCanvasElement,
  { count, color, speed }: { count: number; color: string; speed: number },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;

  let width = 0;
  let height = 0;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Kích thước thật của canvas (toàn màn hình ở trang công khai, khung nhỏ ở trang xem trước).
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  // Số giọt theo diện tích: màn 1440×900 giữ nguyên `count`; ô xem trước nhỏ / điện thoại thưa hơn.
  const areaScale = Math.min(1.5, Math.max(0.12, (width * height) / (1440 * 900)));
  const drops = createRaindrops(Math.max(12, Math.round(count * areaScale)), width, height);
  let frame = 0;
  let last = performance.now();

  const draw = (now: number) => {
    const frames = Math.min(3, (now - last) / (1000 / 60));
    last = now;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const drop of drops) {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x, drop.y + drop.length);
    }
    ctx.stroke();
    stepRaindrops(drops, width, height, frames, speed);
    frame = requestAnimationFrame(draw);
  };

  const onVisibility = () => {
    cancelAnimationFrame(frame);
    if (!document.hidden) {
      last = performance.now();
      frame = requestAnimationFrame(draw);
    }
  };

  frame = requestAnimationFrame(draw);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

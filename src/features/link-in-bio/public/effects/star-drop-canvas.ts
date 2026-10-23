/**
 * Star Drop (kiểu zyo.lol): các chấm sao vuông nhỏ rơi thẳng xuống với 3 lớp
 * tốc độ / kích thước khác nhau. Số sao theo diện tích (màn 1440×900 = `count`).
 */
type Star = { x: number; y: number; size: number; speed: number };

export function startStarDrop(
  canvas: HTMLCanvasElement,
  { count, color, speed }: { count: number; color: string; speed: number },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;

  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scaled = Math.max(12, Math.round(count * Math.min(1.5, Math.max(0.12, (width * height) / (1440 * 900)))));
    stars = Array.from({ length: scaled }, (_, index) => {
      const layer = index % 3; // 0: nhỏ & chậm, 2: to & nhanh
      return { x: Math.random() * width, y: Math.random() * height, size: 1 + layer, speed: (0.25 + layer * 0.35) * (0.8 + Math.random() * 0.4) };
    });
  };
  resize();

  let frame = 0;
  let last = performance.now();
  const draw = (now: number) => {
    const step = Math.min(3, (now - last) / (1000 / 60)) * speed;
    last = now;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    for (const star of stars) {
      star.y += star.speed * step;
      if (star.y > height) {
        star.y = -star.size;
        star.x = Math.random() * width;
      }
      ctx.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size);
    }
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

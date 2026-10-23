"use client";

import { useEffect, useRef } from "react";

import type { BioCursorTrailType } from "@/contracts";
import { cn } from "@/lib/utils";

import styles from "./VEXRO.module.css";

/**
 * Hiệu ứng theo con trỏ (kiểu "Cursor Effects" của guns.lol), tự viết bằng
 * canvas 2D. Canvas phủ toàn trang (position: fixed, không nhận chuột); trong
 * khung xem trước của trình chỉnh sửa nó bám theo khung (contain: layout).
 * Chỉ chạy vòng vẽ khi còn hạt/điểm đang chuyển động — đứng yên thì dừng hẳn.
 */

type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; hue: number; spin: number };
type Point = { x: number; y: number };

const RAINBOW = ["#FE0000", "#FD8C00", "#FFE500", "#119F0B", "#0644B3", "#C22EDC"];

function hexToHue(hex: string) {
  const match = /^#?([0-9a-f]{6})/i.exec(hex);
  if (!match) return 0;
  const value = Number.parseInt(match[1], 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (!d) return -1; // xám/trắng/đen: không có hue
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.35;
    const angle = rotation + (i * Math.PI) / 4;
    ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  ctx.closePath();
}

export function CursorTrail({ type, color, length, className, style }: { type: BioCursorTrailType; color: string; length: number; className?: string; style?: React.CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || type === "none") return;

    const baseHue = hexToHue(color);
    const chainLength = Math.max(4, Math.min(40, length || 12));
    let particles: Particle[] = [];
    let chain: Point[] = [];
    let target: Point | null = null;
    let last: Point | null = null;
    let frame = 0;
    let running = false;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const hueFor = () => (baseHue < 0 ? Math.random() * 360 : baseHue + (Math.random() - 0.5) * 40);
    const spawn = (x: number, y: number, count: number, make: () => Partial<Particle>) => {
      for (let i = 0; i < count; i++) {
        particles.push({ x, y, vx: 0, vy: 0, life: 0, maxLife: 50, size: 3, hue: hueFor(), spin: Math.random() * Math.PI, ...make() });
      }
      if (particles.length > 400) particles = particles.slice(-400);
    };

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const moved = last ? Math.hypot(x - last.x, y - last.y) : 10;
      last = { x, y };
      target = { x, y };
      if (moved < 1) return;
      const r = (spread: number) => (Math.random() - 0.5) * spread;
      switch (type) {
        case "shooting-star":
          spawn(x, y, 2, () => ({ vx: r(1.2), vy: r(1.2), maxLife: 38 + Math.random() * 14, size: 1.6 + Math.random() * 2.2 }));
          break;
        case "fairy-dust":
          spawn(x, y, 2, () => ({ vx: r(1.6), vy: 0.4 + Math.random() * 0.6, maxLife: 60 + Math.random() * 30, size: 3 + Math.random() * 3 }));
          break;
        case "sparkles":
          if (Math.random() < 0.7) spawn(x + r(14), y + r(14), 1, () => ({ vx: r(0.6), vy: r(0.6), maxLife: 40 + Math.random() * 20, size: 4 + Math.random() * 5 }));
          break;
        case "bubbles":
          if (Math.random() < 0.5) spawn(x, y, 1, () => ({ vx: r(0.6), vy: -0.6 - Math.random() * 0.8, maxLife: 80 + Math.random() * 40, size: 3 + Math.random() * 7 }));
          break;
        case "snowflakes":
          if (Math.random() < 0.45) spawn(x, y, 1, () => ({ vx: r(1), vy: 0.8 + Math.random() * 0.8, maxLife: 90 + Math.random() * 40, size: 9 + Math.random() * 7 }));
          break;
        default:
          break;
      }
      if (!running) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    };

    const draw = () => {
      if (canvas.clientWidth !== width || canvas.clientHeight !== height) resize();
      ctx.clearRect(0, 0, width, height);

      // Chuỗi điểm (dots / ghost / rainbow): mỗi điểm đuổi theo điểm trước.
      if (type === "dots" || type === "ghost" || type === "rainbow") {
        if (target) {
          if (chain.length === 0) chain = Array.from({ length: chainLength }, () => ({ ...target! }));
          chain[0].x += (target.x - chain[0].x) * 0.6;
          chain[0].y += (target.y - chain[0].y) * 0.6;
          for (let i = 1; i < chain.length; i++) {
            chain[i].x += (chain[i - 1].x - chain[i].x) * 0.45;
            chain[i].y += (chain[i - 1].y - chain[i].y) * 0.45;
          }
        }
        if (type === "rainbow") {
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          RAINBOW.forEach((stroke, band) => {
            ctx.beginPath();
            chain.forEach((point, i) => {
              const y = point.y + (band - RAINBOW.length / 2) * 2.4;
              if (i === 0) ctx.moveTo(point.x, y);
              else ctx.lineTo(point.x, y);
            });
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 2.6;
            ctx.stroke();
          });
        } else {
          chain.forEach((point, i) => {
            const t = 1 - i / chain.length;
            ctx.globalAlpha = type === "ghost" ? t * 0.35 : t;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, type === "ghost" ? 10 * t + 4 : 5 * t + 1, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.globalAlpha = 1;
        }
      }

      for (const p of particles) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const t = 1 - p.life / p.maxLife;
        if (t <= 0) continue;
        ctx.globalAlpha = Math.max(0, t);
        if (type === "shooting-star") {
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * t + 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (type === "fairy-dust") {
          ctx.fillStyle = `hsl(${p.hue} 100% 70%)`;
          starPath(ctx, p.x, p.y, p.size, p.spin + p.life * 0.05);
          ctx.fill();
        } else if (type === "sparkles") {
          ctx.fillStyle = color;
          starPath(ctx, p.x, p.y, p.size * Math.sin(Math.PI * (1 - t)) + 0.5, p.spin);
          ctx.fill();
        } else if (type === "bubbles") {
          p.vx += Math.sin(p.life * 0.15) * 0.03;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else if (type === "snowflakes") {
          p.vx += Math.sin(p.life * 0.08) * 0.02;
          ctx.fillStyle = color;
          ctx.font = `${p.size}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("❄", p.x, p.y);
        }
      }
      ctx.globalAlpha = 1;
      particles = particles.filter((p) => p.life < p.maxLife);

      // Chuỗi điểm đã về sát con trỏ và không còn hạt → dừng vòng vẽ.
      const settled = !target || chain.length === 0 || Math.hypot(chain[chain.length - 1].x - target.x, chain[chain.length - 1].y - target.y) < 0.5;
      if (particles.length > 0 || !settled) {
        frame = requestAnimationFrame(draw);
      } else {
        running = false;
        // Dots / ghost nằm yên dưới con trỏ; các kiểu khác xoá sạch.
        if (type !== "dots" && type !== "ghost") ctx.clearRect(0, 0, width, height);
      }
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, width, height);
    };
  }, [type, color, length]);

  return <canvas ref={canvasRef} aria-hidden className={cn(styles.cursorTrail, className)} style={style} />;
}

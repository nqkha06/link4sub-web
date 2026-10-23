"use client";

import type React from "react";
import { useEffect, useRef } from "react";

import type { BioDesign } from "@/contracts";
import { cn } from "@/lib/utils";

import styles from "./VEXRO.module.css";
import { startRain } from "./rain-canvas";
import { ShaderCanvas } from "./shader-canvas";
import { AURORA_FRAGMENT, DITHER_FRAGMENT, PLASMA_FRAGMENT } from "./shaders";
import {
  AURORA_LINES_FRAGMENT,
  AURORA_SILK_FRAGMENT,
  CHROMA_WAVES_FRAGMENT,
  CHROMATIC_PULSE_FRAGMENT,
  GLITTER_WARP_FRAGMENT,
  GRADIENT_WAVES_FRAGMENT,
  LIGHT_DROPLETS_FRAGMENT,
  LIGHTSPEED_FRAGMENT,
  LIQUID_FLOW_FRAGMENT,
  LIQUID_LINES_FRAGMENT,
  LUMINOUS_FLOW_FRAGMENT,
  METALLIC_SWIRL_FRAGMENT,
  NEBULA_DRIFT_FRAGMENT,
  SOFT_HORIZON_FRAGMENT,
  SPECTRUM_WARP_FRAGMENT,
  TOPOGRAPHY_FRAGMENT,
  VELVET_WAVES_FRAGMENT,
} from "./shaders-zyo";
import { startStarDrop } from "./star-drop-canvas";

type EffectSettings = BioDesign["effects"]["background"];

/** Vị trí ngang & độ trễ (lắc, rơi) của từng bông tuyết — rải đều 12 cột. */
const SNOWFLAKES: Array<[left: number, shakeDelay: number, fallDelay: number]> = [
  [1, 0, 0], [10, 1, 1], [20, 0.5, 6], [30, 2, 4], [40, 2, 2], [50, 3, 8],
  [60, 2, 6], [70, 1, 2.5], [80, 0, 1], [90, 1.5, 3], [25, 0, 2], [65, 2.5, 4],
];

function RainEffect({ color, speed, density, style }: { color: string; speed: number; density: number; style: React.CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    // density 0–100 → 40–440 giọt (mặc định 40 → 200 giọt).
    return startRain(canvasRef.current, { count: 40 + density * 4, color, speed });
  }, [color, speed, density]);
  return <canvas ref={canvasRef} aria-hidden className={cn(styles.layer, styles.canvas)} style={style} />;
}

/** Shader kiểu zyo.lol theo loại hiệu ứng. */
const ZYO_SHADERS: Partial<Record<EffectSettings["type"], string>> = {
  "chroma-waves": CHROMA_WAVES_FRAGMENT,
  "luminous-flow": LUMINOUS_FLOW_FRAGMENT,
  "aurora-silk": AURORA_SILK_FRAGMENT,
  "velvet-waves": VELVET_WAVES_FRAGMENT,
  "nebula-drift": NEBULA_DRIFT_FRAGMENT,
  "soft-horizon": SOFT_HORIZON_FRAGMENT,
  "liquid-flow": LIQUID_FLOW_FRAGMENT,
  "spectrum-warp": SPECTRUM_WARP_FRAGMENT,
  "aurora-lines": AURORA_LINES_FRAGMENT,
  "chromatic-pulse": CHROMATIC_PULSE_FRAGMENT,
  "glitter-warp": GLITTER_WARP_FRAGMENT,
  "light-droplets": LIGHT_DROPLETS_FRAGMENT,
  lightspeed: LIGHTSPEED_FRAGMENT,
  "liquid-lines": LIQUID_LINES_FRAGMENT,
  "metallic-swirl": METALLIC_SWIRL_FRAGMENT,
  topography: TOPOGRAPHY_FRAGMENT,
  "gradient-waves": GRADIENT_WAVES_FRAGMENT,
};

/** Fragment shader của hiệu ứng (null nếu hiệu ứng không dùng WebGL). */
export function getBioEffectFragment(type: EffectSettings["type"]): string | null {
  if (type === "aurora") return AURORA_FRAGMENT;
  if (type === "plasma") return PLASMA_FRAGMENT;
  if (type === "dither") return DITHER_FRAGMENT;
  return ZYO_SHADERS[type] ?? null;
}

function StarDropEffect({ color, speed, density, style }: { color: string; speed: number; density: number; style: React.CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    return startStarDrop(canvasRef.current, { count: 60 + density * 3, color, speed });
  }, [color, speed, density]);
  return <canvas ref={canvasRef} aria-hidden className={cn(styles.layer, styles.canvas)} style={style} />;
}

/**
 * Hiệu ứng nền của trang bio: rain, snowflakes, blurred, night-time, old-tv,
 * wave, star-drop, noise, dots (CSS/canvas 2D) và aurora, plasma, dither cùng
 * bộ shader kiểu zyo.lol (WebGL).
 */
export function BioBackgroundEffect({ settings, fallbackColor }: { settings: EffectSettings; fallbackColor: string }) {
  if (settings.type === "none") return null;

  const color = /^#[0-9a-f]{6}/i.test(settings.color) ? settings.color : fallbackColor;
  const hideOnMobile = !settings.mobileEnabled && "max-sm:hidden";
  const style: React.CSSProperties = {
    opacity: settings.opacity / 100,
    mixBlendMode: settings.blendMode,
  };
  const amplitude = settings.intensity / 100;

  switch (settings.type) {
    case "rain":
      return <RainEffect color={color} speed={settings.speed} density={settings.density} style={style} />;

    case "snowflakes": {
      const count = Math.max(4, Math.min(SNOWFLAKES.length, Math.round(settings.density / 100 * 12) || 12));
      return (
        <div aria-hidden className={cn(styles.layer, styles.front, styles.snowflakes, hideOnMobile)} style={{ ...style, color }}>
          {SNOWFLAKES.slice(0, count).map(([left, shake, fall], index) => (
            <div
              key={index}
              className={styles.snowflake}
              style={{ left: `${left}%`, animationDelay: `${shake}s`, animationDuration: `${3 / settings.speed}s` }}
            >
              <span style={{ animationDelay: `${fall}s`, animationDuration: `${10 / settings.speed}s` }}>❅</span>
            </div>
          ))}
        </div>
      );
    }

    case "blurred":
      return <div aria-hidden className={cn(styles.layer, styles.blurred)} style={style} />;

    case "night-time":
      return <div aria-hidden className={cn(styles.layer, styles.night)} style={style} />;

    case "old-tv":
      return <div aria-hidden className={cn(styles.layer, styles.tv)} style={style} />;

    case "aurora":
      return <ShaderCanvas fragment={AURORA_FRAGMENT} color={color} speed={settings.speed} amplitude={amplitude} className={cn(styles.layer, styles.canvas, hideOnMobile)} style={style} />;

    case "plasma":
      return <ShaderCanvas fragment={PLASMA_FRAGMENT} color={color} speed={settings.speed} amplitude={amplitude} className={cn(styles.layer, styles.canvas, hideOnMobile)} style={style} />;

    case "dither":
      return <ShaderCanvas fragment={DITHER_FRAGMENT} color={color} speed={settings.speed} amplitude={amplitude * 0.6} interactive className={cn(styles.layer, styles.canvas, hideOnMobile)} style={style} />;

    case "wave":
      return (
        <div aria-hidden className={cn(styles.layer, styles.waves)} style={{ ...style, "--fx-color": color } as React.CSSProperties}>
          <div className={styles.waveLayer} />
          <div className={styles.waveLayer} />
        </div>
      );

    case "star-drop":
      return <StarDropEffect color={color} speed={settings.speed} density={settings.density} style={style} />;

    case "noise":
      return <div aria-hidden className={cn(styles.layer, styles.noise)} style={style} />;

    case "dots":
      return <div aria-hidden className={cn(styles.layer, styles.dots)} style={style} />;

    default: {
      const fragment = ZYO_SHADERS[settings.type];
      return fragment ? (
        <ShaderCanvas fragment={fragment} color={color} speed={settings.speed} amplitude={amplitude} className={cn(styles.layer, styles.canvas, hideOnMobile)} style={style} />
      ) : null;
    }
  }
}

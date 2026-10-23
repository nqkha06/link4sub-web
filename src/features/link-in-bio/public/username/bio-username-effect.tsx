"use client";

import type React from "react";
import { useEffect, useId, useState } from "react";

import type { BioUsernameEffect } from "@/contracts";
import { cn } from "@/lib/utils";

import { scrambleFrame, shuffledOrder, typewriterText } from "./scramble";
import styles from "./VEXRO.module.css";

/** Vị trí lấp lánh quanh chữ (hiệu ứng "stars"). */
const STARS: Array<[left: string, top: string, delay: number]> = [
  ["-6%", "-10%", 0], ["18%", "-30%", 0.7], ["46%", "-22%", 1.5], ["78%", "-28%", 0.3],
  ["102%", "6%", 1.1], ["90%", "88%", 1.9], ["60%", "96%", 0.5], ["26%", "92%", 1.3], ["-4%", "70%", 2],
];

/**
 * Ảnh GIF cho hiệu ứng "sparkles-*", đặt trong `public/assets/bio/sparkles/`.
 * Thiếu file thì tên vẫn hiển thị bình thường, chỉ không có đốm sáng.
 */
export const SPARKLE_GIF_DIR = "/assets/bio/sparkles";

export function getSparkleGif(effect: string) {
  const color = /^sparkles-(black|blue|green|pink|red|white|yellow)$/.exec(effect)?.[1];
  return color ? `${SPARKLE_GIF_DIR}/sparkle_${color}.gif` : null;
}

const BOLTS: Array<[left: string, delay: number, rotate: number]> = [
  ["14%", 0, -12],
  ["62%", 1.6, 10],
];

/** Gõ rồi xoá tên (giữ 1.4s khi gõ xong, nghỉ 0.4s khi xoá hết). */
function useTypewriter(text: string, active: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return;
    const length = Array.from(text).length;
    let current = 0;
    let timer = 0;
    const tick = () => {
      current = (current + 1) % (length * 2);
      setStep(current);
      const position = current % (length * 2);
      const delay = position === length ? 1400 : position === 0 ? 400 : position > length ? 55 : 110;
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, 400);
    return () => window.clearTimeout(timer);
  }, [text, active]);
  return typewriterText(text, step);
}

/** Xáo chữ rồi giải mã; lặp lại sau mỗi `interval` ms. */
function useScramble(text: string, mode: "sweep" | "random" | null) {
  const [frame, setFrame] = useState(text);
  useEffect(() => {
    if (!mode) return;
    const duration = mode === "sweep" ? 1100 : 1400;
    const interval = mode === "sweep" ? 4200 : 4800;
    const order = shuffledOrder(Array.from(text).length);
    let raf = 0;
    let start = performance.now();
    let lastPaint = 0;
    const loop = (now: number) => {
      const elapsed = (now - start) % interval;
      if (now - lastPaint > 45) {
        lastPaint = now;
        setFrame(elapsed < duration ? scrambleFrame(text, elapsed / duration, mode, order) : text);
      }
      raf = requestAnimationFrame(loop);
    };
    start = performance.now();
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [text, mode]);
  return mode ? frame : text;
}

/**
 * Tên hiển thị kèm hiệu ứng. Nội dung đọc bởi trình đọc màn hình luôn là tên
 * đầy đủ (aria-label), phần chữ động chỉ để nhìn.
 */
export function BioUsernameEffect({
  text,
  effect,
  as: Tag = "span",
  id,
  className,
  style,
}: {
  text: string;
  effect: BioUsernameEffect;
  as?: "span" | "h1" | "h2" | "h3" | "h4";
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const filterId = `bio-name-${useId().replace(/:/g, "")}`;
  const typed = useTypewriter(text, effect === "typewriter");
  const scrambled = useScramble(text, effect === "scramble" ? "sweep" : effect === "scramble-2" ? "random" : null);

  let content: React.ReactNode = text;
  let effectClass = "";
  let extra: React.ReactNode = null;
  let filter: string | undefined;
  let extraStyle: React.CSSProperties | undefined;

  switch (effect) {
    case "rainbow": effectClass = styles.rainbow; break;
    case "shine": effectClass = styles.shine; break;
    case "shimmer": effectClass = styles.shimmer; break;
    case "neon": effectClass = styles.neon; break;
    case "glitch": effectClass = styles.glitch; break;
    case "glitch-2": effectClass = styles.glitch2; break;
    case "pulse": effectClass = styles.pulse; break;
    case "typewriter":
      content = <>{typed}<span className={styles.caret} /></>;
      break;
    case "scramble":
    case "scramble-2":
      content = scrambled;
      break;
    case "wave":
      effectClass = styles.wave;
      content = Array.from(text).map((char, index) => (
        <span key={index} style={{ "--i": index } as React.CSSProperties}>{char === " " ? " " : char}</span>
      ));
      break;
    case "lightning":
      effectClass = styles.lightning;
      extra = BOLTS.map(([left, delay, rotate]) => (
        <span key={left} className={styles.bolt} style={{ left, animationDelay: `${delay}s`, transform: `rotate(${rotate}deg)` }} />
      ));
      break;
    case "stars":
      extra = STARS.map(([left, top, delay], index) => (
        <span key={index} className={styles.star} style={{ left, top, animationDelay: `${delay}s` }}>✦</span>
      ));
      break;
    case "distort":
    case "fuzzy":
      filter = `url(#${filterId})`;
      extra = (
        <svg className={styles.filterDefs} aria-hidden focusable="false">
          <filter id={filterId} x="-10%" y="-20%" width="120%" height="140%">
            {effect === "distort" ? (
              <>
                <feTurbulence type="fractalNoise" baseFrequency="0.015 0.06" numOctaves="2" seed="3">
                  <animate attributeName="baseFrequency" dur="6s" values="0.015 0.06;0.03 0.1;0.015 0.06" repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" scale="7" xChannelSelector="R" yChannelSelector="G" />
              </>
            ) : (
              <>
                <feTurbulence type="turbulence" baseFrequency="0.01 0.75" numOctaves="1" seed="1">
                  <animate attributeName="seed" dur="0.6s" values="1;4;8;2;6;9;3" calcMode="discrete" repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="R" />
              </>
            )}
          </filter>
        </svg>
      );
      break;
    default: {
      const gif = getSparkleGif(effect);
      if (gif) {
        effectClass = styles.sparkles;
        extraStyle = { "--sparkle-image": `url("${gif}")` } as React.CSSProperties;
      }
      break;
    }
  }

  return (
    <Tag
      id={id}
      aria-label={effect === "none" ? undefined : text}
      data-text={text}
      className={cn(styles.root, effectClass, className)}
      style={filter || extraStyle ? { ...style, ...extraStyle, ...(filter ? { filter } : {}) } : style}
    >
      {effect === "none" ? text : <span aria-hidden>{content}</span>}
      {extra}
    </Tag>
  );
}

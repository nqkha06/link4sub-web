"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import { cn } from "@/lib/utils";

/**
 * Shared "Unlock Signal" primitives — the visual language reused across the
 * hero, how-it-works, value-exchange and creator-loop sections: a token
 * moving through the flow, connector lines it travels along, and nodes that
 * switch from primary (in progress) to success (done). Kept in one place so
 * the motion, timing and colors stay consistent everywhere it appears.
 */

type Tone = "primary" | "success" | "muted";

const dotTone: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  muted: "bg-border",
};

export function SignalNode({
  tone = "muted",
  pulse = false,
  size = "md",
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const dimension = size === "sm" ? "size-2" : "size-2.5";

  return (
    <span className={cn("relative grid shrink-0 place-items-center", className)} aria-hidden>
      {pulse && !reduceMotion ? (
        <motion.span
          className={cn("absolute rounded-full", dotTone[tone])}
          style={{ inset: 0 }}
          animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      ) : null}
      <span
        className={cn(
          "relative z-10 rounded-full ring-4 ring-background transition-colors duration-300",
          dimension,
          dotTone[tone],
        )}
      />
    </span>
  );
}

/** A straight connector line with a traveling gradient "signal" beam. */
export function SignalBeam({
  orientation = "horizontal",
  tone = "primary",
  active = true,
  speed = 2.4,
  className,
}: {
  orientation?: "horizontal" | "vertical";
  tone?: Exclude<Tone, "muted">;
  active?: boolean;
  speed?: number;
  className?: string;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const isHorizontal = orientation === "horizontal";
  const gradient =
    tone === "success"
      ? isHorizontal
        ? "bg-gradient-to-r from-transparent via-success to-transparent"
        : "bg-gradient-to-b from-transparent via-success to-transparent"
      : isHorizontal
        ? "bg-gradient-to-r from-transparent via-primary to-transparent"
        : "bg-gradient-to-b from-transparent via-primary to-transparent";

  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden bg-border",
        isHorizontal ? "h-px w-full" : "h-full w-px",
        className,
      )}
    >
      {active && !reduceMotion ? (
        <motion.div
          className={cn(isHorizontal ? "h-px w-14" : "h-14 w-px", gradient)}
          initial={isHorizontal ? { x: "-20%" } : { y: "-20%" }}
          animate={isHorizontal ? { x: "220%" } : { y: "220%" }}
          transition={{ duration: speed, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
    </div>
  );
}

/** Faint background wash used to loosely tie sections together without a literal line. */
export function SignalField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div
        className="absolute inset-0 opacity-[0.45] dark:opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--foreground) 12%, transparent) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 65% 60% at 50% 40%, black 30%, transparent 100%)",
        }}
      />
    </div>
  );
}

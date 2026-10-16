"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { Check, FileText, Lock, LockOpen, UserRound, Users } from "lucide-react";

import { cn } from "@/lib/utils";

type Mode = "normal" | "link4sub";
type ActionState = "idle" | "active" | "done";

type Phase = {
  signal: number; // percentage along the track, 0-100
  action: ActionState;
  unlocked: boolean;
  growth: boolean;
  fade?: boolean;
  duration: number;
};

const normalPhases: Phase[] = [
  { signal: 8, action: "idle", unlocked: false, growth: false, duration: 750 },
  { signal: 92, action: "idle", unlocked: false, growth: false, duration: 900 },
  { signal: 92, action: "idle", unlocked: false, growth: false, fade: true, duration: 1300 },
];

const link4subPhases: Phase[] = [
  { signal: 8, action: "idle", unlocked: false, growth: false, duration: 750 },
  { signal: 48, action: "active", unlocked: false, growth: false, duration: 850 },
  { signal: 48, action: "done", unlocked: false, growth: false, duration: 650 },
  { signal: 92, action: "done", unlocked: true, growth: false, duration: 750 },
  { signal: 92, action: "done", unlocked: true, growth: true, duration: 2600 },
];

/**
 * The one deliberately high-contrast beat on the page: a dark band (theme
 * tokens only — bg-foreground/text-background, so it still tracks the
 * design system rather than a hardcoded color) that breaks the light
 * rhythm of the rest of the landing page and gives the comparison real
 * weight instead of two quiet cards.
 */
export function ValueExchange() {
  const reduceMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<Mode>("link4sub");

  return (
    <section
      id="why-link4sub"
      className="relative scroll-mt-20 overflow-hidden bg-foreground py-24 md:py-32"
    >
      <ContrastBackground />

      <div className="relative mx-auto w-full max-w-[1180px] px-4 md:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="type-marketing-section-title text-background">
            The same click.
            <br className="hidden sm:block" /> A completely different outcome.
          </h2>
        </div>

        <div className="mt-9 flex justify-center">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        <div className="mt-10 md:mt-14">
          <ExchangeStage key={mode} mode={mode} reduceMotion={!!reduceMotion} />
        </div>
      </div>
    </section>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Compare a normal link with Link4Sub"
      className="inline-flex items-center gap-0.5 rounded-md border border-background/15 bg-background/10 p-[3px]"
    >
      {(
        [
          { id: "normal", label: "Normal link" },
          { id: "link4sub", label: "Link4Sub" },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={mode === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "type-label rounded-sm px-3.5 py-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-background/40",
            mode === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-background/55 hover:text-background/85",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ExchangeStage({
  mode,
  reduceMotion,
}: {
  mode: Mode;
  reduceMotion: boolean;
}) {
  const phases = mode === "normal" ? normalPhases : link4subPhases;
  const lastIndex = phases.length - 1;
  const [index, setIndex] = useState(reduceMotion ? lastIndex : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setTimeout(() => {
      setIndex((i) => (i + 1) % phases.length);
    }, phases[index].duration);
    return () => window.clearTimeout(timer);
  }, [index, reduceMotion, phases]);

  const phase = phases[index];
  const hasAction = mode === "link4sub";
  const signalTone = phase.action === "done" || phase.unlocked ? "bg-success" : "bg-primary";

  return (
    <div className="mx-auto max-w-[760px] rounded-2xl border border-background/15 bg-background/[0.06] px-6 py-12 md:px-14 md:py-16">
      <div className="relative flex h-28 items-center justify-between">
        <div className="absolute top-1/2 right-6 left-6 h-px -translate-y-1/2 bg-background/15" />

        {!reduceMotion ? (
          <motion.span
            aria-hidden
            className={cn(
              "absolute top-1/2 z-10 size-3 -translate-y-1/2 rounded-full ring-4 ring-foreground transition-colors duration-300",
              signalTone,
            )}
            animate={{ left: `${phase.signal}%`, opacity: phase.fade ? 0 : 1 }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
          />
        ) : (
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 z-10 size-3 -translate-y-1/2 rounded-full ring-4 ring-foreground",
              signalTone,
            )}
            style={{ left: `${phase.signal}%` }}
          />
        )}

        <StageNode label="Visitor" tone="neutral">
          <UserRound className="size-4" />
        </StageNode>

        <AnimatePresence>
          {hasAction ? (
            <motion.div
              key="action"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-10"
            >
              <ActionPill state={phase.action} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <StageNode
          label={phase.unlocked ? "Unlocked" : "Content"}
          tone={phase.unlocked ? "success" : "neutral"}
        >
          {hasAction ? (
            phase.unlocked ? (
              <LockOpen className="size-4" />
            ) : (
              <Lock className="size-4" />
            )
          ) : (
            <FileText className="size-4" />
          )}
        </StageNode>
      </div>

      <div className="mt-6 flex min-h-6 items-center justify-center">
        <AnimatePresence>
          {phase.growth ? (
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="type-caption inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/15 px-3 py-1 font-medium text-success"
            >
              <Users className="size-3.5" />
              Audience grows
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <p className="type-body-sm mt-2 text-center text-background/60">
        {mode === "normal" ? "Click. Access. Gone." : "The same visit creates value first."}
      </p>
    </div>
  );
}

function StageNode({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "neutral" | "success";
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-2 bg-foreground px-1.5">
      <span
        className={cn(
          "grid size-12 place-items-center rounded-full border-2 transition-colors duration-300",
          tone === "success"
            ? "border-success/50 bg-success/15 text-success"
            : "border-background/25 bg-background/5 text-background/70",
        )}
      >
        {children}
      </span>
      <span className="type-caption text-background/55">{label}</span>
    </div>
  );
}

function ActionPill({ state }: { state: ActionState }) {
  return (
    <div
      className={cn(
        "type-caption flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium whitespace-nowrap transition-colors duration-300",
        state === "done"
          ? "border-success/40 bg-success/15 text-success"
          : state === "active"
            ? "border-primary/40 bg-primary/15 text-primary"
            : "border-background/20 bg-background/5 text-background/60",
      )}
    >
      {state === "done" ? <Check className="size-3" strokeWidth={3} /> : null}
      Subscribe
    </div>
  );
}

function ContrastBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--background) 16%, transparent) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 70% 65% at 50% 40%, black 25%, transparent 100%)",
        }}
      />
      <div
        className="absolute top-[-10%] left-[10%] h-[420px] w-[420px] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 45%, transparent) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute right-[6%] bottom-[-14%] h-[380px] w-[380px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--success) 45%, transparent) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

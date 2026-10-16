"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { Check, Loader2, Lock, LockOpen } from "lucide-react";

import { heroActions } from "@/components/landing-v2/data";
import { SignalNode } from "@/components/landing-v2/signal";
import { cn } from "@/lib/utils";

type ActionState = "idle" | "checking" | "done";

// Phase index -> [state of action 0, state of action 1, hold duration ms]
const phases: Array<{ states: [ActionState, ActionState]; duration: number }> = [
  { states: ["idle", "idle"], duration: 1100 },
  { states: ["checking", "idle"], duration: 950 },
  { states: ["done", "idle"], duration: 850 },
  { states: ["done", "checking"], duration: 950 },
  { states: ["done", "done"], duration: 2900 },
];

export function UnlockPanel({ className }: { className?: string }) {
  const reduceMotion = usePrefersReducedMotion();
  // Reduced motion: skip the loop and settle on the fully unlocked frame —
  // the meaningful end state, not a snapshot mid-transition.
  const [phase, setPhase] = useState(reduceMotion ? phases.length - 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const current = phases[phase];
    const timer = window.setTimeout(() => {
      setPhase((p) => (p + 1) % phases.length);
    }, current.duration);
    return () => window.clearTimeout(timer);
  }, [phase, reduceMotion]);

  const states = phases[phase].states;
  const completedCount = states.filter((s) => s === "done").length;
  const isUnlocked = completedCount === heroActions.length;
  const progress = (completedCount / heroActions.length) * 100;

  const statusLabel = useMemo(() => {
    if (isUnlocked) return "2 / 2 completed";
    return `${completedCount} / ${heroActions.length} completed`;
  }, [completedCount, isUnlocked]);

  return (
    <motion.div
      className={cn(
        "relative w-full max-w-[440px] rounded-[1.75rem] border bg-card p-6 transition-colors duration-500",
        isUnlocked ? "border-success/30" : "border-border",
        className,
      )}
      role="group"
      aria-label="Example unlock experience"
      animate={{
        boxShadow: isUnlocked
          ? "0 1px 2px rgba(24,28,36,0.06), 0 32px 70px -24px color-mix(in oklab, var(--success) 38%, transparent)"
          : "0 1px 2px rgba(24,28,36,0.06), 0 24px 56px -26px rgba(24,28,36,0.22)",
      }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-sm font-semibold text-primary-foreground">
          A
        </span>
        <div className="min-w-0">
          <p className="type-label truncate text-foreground">alex.creates</p>
          <p className="type-caption text-muted-foreground">Free Lightroom Presets Pack</p>
        </div>
        <span
          className={cn(
            "ml-auto grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border transition-colors duration-300",
            isUnlocked
              ? "border-success/30 bg-success/10 text-success"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isUnlocked ? (
              <motion.span
                key="open"
                initial={{ rotate: -50, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.32, ease: "easeOut" }}
                className="grid place-items-center"
              >
                <LockOpen className="size-[18px]" />
              </motion.span>
            ) : (
              <motion.span
                key="closed"
                initial={{ rotate: 20, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.32, ease: "easeOut" }}
                className="grid place-items-center"
              >
                <Lock className="size-[18px]" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>

      <p className="type-caption mt-5 text-muted-foreground">
        Complete {heroActions.length} actions to unlock
      </p>

      <div className="mt-3 flex flex-col gap-2.5">
        {heroActions.map((action, index) => {
          const state = states[index];
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors duration-300",
                state === "done"
                  ? "border-success/25 bg-success/10"
                  : state === "checking"
                    ? "border-primary/25 bg-primary/5"
                    : "border-border bg-background",
              )}
            >
              {state === "checking" ? (
                <SignalNode tone="primary" pulse className="shrink-0" />
              ) : (
                <Icon size={18} className="shrink-0 text-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="type-body-sm truncate text-foreground">{action.label}</p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={state}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "type-caption",
                      state === "done"
                        ? "text-success"
                        : state === "checking"
                          ? "text-primary"
                          : "text-muted-foreground",
                    )}
                  >
                    {state === "done" ? "Completed" : state === "checking" ? "Checking…" : "Pending"}
                  </motion.p>
                </AnimatePresence>
              </div>
              <ActionStatus state={state} reduceMotion={!!reduceMotion} />
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="type-caption text-muted-foreground">{statusLabel}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn("h-full rounded-full", isUnlocked ? "bg-success" : "bg-primary")}
            animate={{ width: `${progress}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!isUnlocked}
        tabIndex={-1}
        aria-hidden="true"
        className={cn(
          "type-label mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl transition-colors duration-300",
          isUnlocked
            ? "bg-primary text-primary-foreground"
            : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        {isUnlocked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
        Unlock content
      </button>

      <AnimatePresence>
        {isUnlocked ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="type-caption absolute -top-3 right-5 flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 font-medium text-success shadow-sm"
          >
            <Check className="size-3.5" />
            Content unlocked
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function ActionStatus({ state, reduceMotion }: { state: ActionState; reduceMotion: boolean }) {
  if (state === "done") {
    return (
      <motion.span
        initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 18 }}
        className="grid size-6 shrink-0 place-items-center rounded-full bg-success text-white"
      >
        <Check className="size-3.5" strokeWidth={2.75} />
      </motion.span>
    );
  }
  if (state === "checking") {
    return (
      <span className="grid size-6 shrink-0 place-items-center text-primary">
        <Loader2 className="size-4 animate-spin" />
      </span>
    );
  }
  return <span className="size-6 shrink-0 rounded-full border-2 border-border" />;
}

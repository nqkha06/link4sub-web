"use client";

import { AlertTriangle, CheckCircle2, CircleSlash, Loader2, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { describeSchedule } from "../schedule-format";
import type { CronJobConfig, CronJobRun, CronJobRunStatus } from "../types";

const STATUS_STYLE: Record<CronJobRunStatus, { icon: typeof CheckCircle2; className: string }> = {
  completed: {
    icon: CheckCircle2,
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  failed: { icon: XCircle, className: "border-destructive/30 bg-destructive/10 text-destructive" },
  running: { icon: Loader2, className: "border-primary/30 bg-primary/10 text-primary" },
  interrupted: {
    icon: CircleSlash,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

export function RunStatusBadge({ status }: { status: CronJobRunStatus }) {
  const t = useTranslations("Admin.cronJobs.status");
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.interrupted;
  const Icon = style.icon;
  return (
    <Badge variant="outline" className={style.className}>
      <Icon className={cn(status === "running" && "animate-spin")} />
      {t(status)}
    </Badge>
  );
}

export function LateBadge() {
  const t = useTranslations("Admin.cronJobs.badges");
  return (
    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
      <AlertTriangle />
      {t("late")}
    </Badge>
  );
}

/** Câu mô tả lịch chạy, kèm múi giờ khi là biểu thức cron. */
export function useScheduleText() {
  const t = useTranslations("Admin.cronJobs");
  return (schedule: Pick<CronJobConfig, "mode" | "pattern" | "everyMs" | "tz">) => {
    const description = describeSchedule(schedule);
    const values =
      description.key === "weeklyAt"
        ? { ...description.values, weekday: t(`weekdays.${description.values.weekday}`) }
        : description.values;
    const text = t(`schedule.${description.key}`, values as Record<string, string | number>);
    return schedule.mode === "cron" && description.key !== "none" ? `${text} (${schedule.tz})` : text;
  };
}

export function useDurationText() {
  const t = useTranslations("Admin.cronJobs.units");
  return (ms: number) => {
    if (ms % 86_400_000 === 0) return t("days", { count: ms / 86_400_000 });
    if (ms % 3_600_000 === 0) return t("hours", { count: ms / 3_600_000 });
    if (ms % 60_000 === 0) return t("minutes", { count: ms / 60_000 });
    return t("seconds", { count: Math.round(ms / 1_000) });
  };
}

// Đồng hồ dùng chung cho thời gian tương đối. Server và lần hydrate đầu nhận
// `null` (không render giờ) để HTML server khớp client; sau đó mới có giờ thật.
let nowValue = Date.now();
let nowTimer: number | undefined;
const nowListeners = new Set<() => void>();

function subscribeNow(listener: () => void) {
  nowListeners.add(listener);
  nowValue = Date.now();
  if (nowTimer === undefined) {
    nowTimer = window.setInterval(() => {
      nowValue = Date.now();
      nowListeners.forEach((notify) => notify());
    }, 15_000);
  }
  return () => {
    nowListeners.delete(listener);
    if (nowListeners.size === 0 && nowTimer !== undefined) {
      window.clearInterval(nowTimer);
      nowTimer = undefined;
    }
  };
}

export function useNow() {
  return React.useSyncExternalStore(
    subscribeNow,
    () => nowValue,
    () => null,
  );
}

const PENDING = "—";

/**
 * Định dạng ngày giờ theo locale và múi giờ của trình duyệt. Trả "—" khi chưa
 * chạy trên client để tránh lệch hydration (server khác múi giờ / thời điểm).
 */
export function useDateFormat() {
  const locale = useLocale();
  const now = useNow();
  const ready = now !== null;
  const absolute = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium" });
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return {
    ready,
    absolute: (value: string | Date) => (ready ? absolute.format(new Date(value)) : PENDING),
    inZone: (value: string | Date, timeZone: string) =>
      ready
        ? new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short", timeZone }).format(new Date(value))
        : PENDING,
    relative: (value: string | Date) => {
      if (!ready) return PENDING;
      const diff = new Date(value).getTime() - now;
      const abs = Math.abs(diff);
      if (abs < 60_000) return relative.format(Math.round(diff / 1_000), "second");
      if (abs < 3_600_000) return relative.format(Math.round(diff / 60_000), "minute");
      if (abs < 86_400_000) return relative.format(Math.round(diff / 3_600_000), "hour");
      return relative.format(Math.round(diff / 86_400_000), "day");
    },
  };
}

export function TriggerLabel({ run }: { run: Pick<CronJobRun, "trigger" | "triggeredBy"> }) {
  const t = useTranslations("Admin.cronJobs.trigger");
  if (run.trigger === "manual") {
    return <>{run.triggeredBy ? t("manualBy", { name: run.triggeredBy.name }) : t("manual")}</>;
  }
  return <>{t("schedule")}</>;
}

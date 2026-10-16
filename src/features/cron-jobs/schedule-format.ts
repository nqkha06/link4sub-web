/**
 * Mô tả lịch chạy thành câu dễ đọc. Trả về khóa i18n (dưới
 * `Admin.cronJobs.schedule`) cùng tham số; lịch không nhận dạng được thì
 * trả `custom` kèm biểu thức gốc.
 */
export type ScheduleDescription =
  | { key: "everySeconds" | "everyMinutes" | "everyHours" | "everyDays"; values: { count: number } }
  | { key: "hourlyAt"; values: { minute: string } }
  | { key: "dailyAt"; values: { time: string } }
  | { key: "weeklyAt"; values: { time: string; weekday: number } }
  | { key: "monthlyAt"; values: { time: string; day: number } }
  | { key: "custom"; values: { pattern: string } }
  | { key: "none"; values: Record<string, never> };

type ScheduleInput = { mode: "cron" | "every"; pattern: string | null; everyMs: number | null };

const NUMBER = /^\d+$/;

function pad(value: string) {
  return value.padStart(2, "0");
}

export function describeEvery(everyMs: number): ScheduleDescription {
  if (everyMs % 86_400_000 === 0) return { key: "everyDays", values: { count: everyMs / 86_400_000 } };
  if (everyMs % 3_600_000 === 0) return { key: "everyHours", values: { count: everyMs / 3_600_000 } };
  if (everyMs % 60_000 === 0) return { key: "everyMinutes", values: { count: everyMs / 60_000 } };
  return { key: "everySeconds", values: { count: Math.round(everyMs / 1_000) } };
}

export function describeSchedule(schedule: ScheduleInput): ScheduleDescription {
  if (schedule.mode === "every") {
    return schedule.everyMs ? describeEvery(schedule.everyMs) : { key: "none", values: {} };
  }
  const pattern = (schedule.pattern ?? "").trim().split(/\s+/).filter(Boolean);
  if (pattern.length !== 5) {
    return pattern.length ? { key: "custom", values: { pattern: pattern.join(" ") } } : { key: "none", values: {} };
  }
  const [minute, hour, day, month, weekday] = pattern;
  const custom: ScheduleDescription = { key: "custom", values: { pattern: pattern.join(" ") } };
  if (month !== "*") return custom;

  const step = minute.match(/^\*\/(\d+)$/);
  if (step && hour === "*" && day === "*" && weekday === "*") {
    return { key: "everyMinutes", values: { count: Number(step[1]) } };
  }
  const hourStep = hour.match(/^\*\/(\d+)$/);
  if (minute === "0" && hourStep && day === "*" && weekday === "*") {
    return { key: "everyHours", values: { count: Number(hourStep[1]) } };
  }
  if (!NUMBER.test(minute)) return custom;
  if (hour === "*" && day === "*" && weekday === "*") {
    return { key: "hourlyAt", values: { minute: pad(minute) } };
  }
  if (!NUMBER.test(hour)) return custom;
  const time = `${pad(hour)}:${pad(minute)}`;
  if (day === "*" && weekday === "*") return { key: "dailyAt", values: { time } };
  if (day === "*" && NUMBER.test(weekday)) {
    return { key: "weeklyAt", values: { time, weekday: Number(weekday) % 7 } };
  }
  if (NUMBER.test(day) && weekday === "*") {
    return { key: "monthlyAt", values: { time, day: Number(day) } };
  }
  return custom;
}

export type EveryUnit = "seconds" | "minutes" | "hours" | "days";

export const EVERY_UNIT_MS: Record<EveryUnit, number> = {
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};

/** Tách chu kỳ (ms) thành số + đơn vị lớn nhất chia hết. */
export function splitEvery(everyMs: number): { amount: number; unit: EveryUnit } {
  for (const unit of ["days", "hours", "minutes"] as const) {
    if (everyMs % EVERY_UNIT_MS[unit] === 0) return { amount: everyMs / EVERY_UNIT_MS[unit], unit };
  }
  return { amount: Math.round(everyMs / 1_000), unit: "seconds" };
}

export function formatDurationShort(ms: number) {
  if (ms < 1_000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(ms < 10_000 ? 1 : 0)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1_000);
  if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export type CronPreset = "hourly" | "daily" | "weekly" | "monthly" | "custom";

export type CronPresetValue = {
  preset: CronPreset;
  minute: number;
  hour: number;
  weekday: number;
  day: number;
};

/** Nhận dạng biểu thức cron thành mẫu nhanh để điền form. */
export function parseCronPreset(pattern: string | null): CronPresetValue {
  const fallback: CronPresetValue = { preset: "custom", minute: 0, hour: 0, weekday: 1, day: 1 };
  const description = describeSchedule({ mode: "cron", pattern, everyMs: null });
  const timeOf = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    return { hour, minute };
  };
  switch (description.key) {
    case "hourlyAt":
      return { ...fallback, preset: "hourly", minute: Number(description.values.minute) };
    case "dailyAt":
      return { ...fallback, preset: "daily", ...timeOf(description.values.time) };
    case "weeklyAt":
      return { ...fallback, preset: "weekly", weekday: description.values.weekday, ...timeOf(description.values.time) };
    case "monthlyAt":
      return { ...fallback, preset: "monthly", day: description.values.day, ...timeOf(description.values.time) };
    default:
      return fallback;
  }
}

export function buildCronPattern(value: CronPresetValue): string | null {
  switch (value.preset) {
    case "hourly":
      return `${value.minute} * * * *`;
    case "daily":
      return `${value.minute} ${value.hour} * * *`;
    case "weekly":
      return `${value.minute} ${value.hour} * * ${value.weekday}`;
    case "monthly":
      return `${value.minute} ${value.hour} ${value.day} * *`;
    default:
      return null;
  }
}

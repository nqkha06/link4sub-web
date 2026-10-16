"use client";

import { Info, Loader2, Lock, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getApiErrorMessage } from "@/lib/api-response";

import { previewCronSchedule, resetCronJob, updateCronJob } from "../api/cron-jobs.client";
import {
  buildCronPattern,
  EVERY_UNIT_MS,
  parseCronPreset,
  splitEvery,
  type CronPreset,
  type CronPresetValue,
  type EveryUnit,
} from "../schedule-format";
import type { CronJob, CronSchedulePreview, CronScheduleMode } from "../types";
import { useDateFormat, useDurationText, useScheduleText } from "./cron-job-ui";

const TIME_ZONES = ["Asia/Ho_Chi_Minh", "UTC"];
const PRESETS: CronPreset[] = ["hourly", "daily", "weekly", "monthly", "custom"];
const UNITS: EveryUnit[] = ["seconds", "minutes", "hours", "days"];

type Draft = {
  mode: CronScheduleMode;
  everyAmount: string;
  everyUnit: EveryUnit;
  preset: CronPresetValue;
  pattern: string;
  tz: string;
};

function draftFrom(job: CronJob): Draft {
  const every = splitEvery(job.everyMs ?? job.defaults.everyMs ?? 60_000);
  const pattern = job.pattern ?? job.defaults.pattern ?? "0 0 * * *";
  return {
    mode: job.mode,
    everyAmount: String(every.amount),
    everyUnit: every.unit,
    preset: parseCronPreset(pattern),
    pattern,
    tz: job.tz,
  };
}

function draftSchedule(draft: Draft) {
  const amount = Number(draft.everyAmount);
  return {
    mode: draft.mode,
    pattern: draft.mode === "cron" ? draft.pattern.trim().split(/\s+/).join(" ") : null,
    everyMs:
      draft.mode === "every" && Number.isFinite(amount) && amount > 0
        ? Math.round(amount * EVERY_UNIT_MS[draft.everyUnit])
        : null,
    tz: draft.tz,
  };
}

function toTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function CronJobScheduleForm({
  job,
  canManage,
  onSaved,
}: {
  job: CronJob;
  canManage: boolean;
  onSaved: (job: CronJob) => void;
}) {
  const t = useTranslations("Admin.cronJobs");
  const scheduleText = useScheduleText();
  const durationText = useDurationText();
  const dates = useDateFormat();
  const [draft, setDraft] = React.useState(() => draftFrom(job));
  // Kết quả xem trước gắn với lịch đã gửi; khác lịch hiện tại nghĩa là đang tải.
  const [previewState, setPreviewState] = React.useState<{ key: string; result: CronSchedulePreview } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  const disabled = !canManage || Boolean(job.lockedBy) || saving;
  const schedule = draftSchedule(draft);
  const dirty =
    schedule.mode !== job.mode ||
    schedule.tz !== job.tz ||
    (schedule.mode === "cron" ? schedule.pattern !== job.pattern : schedule.everyMs !== job.everyMs);

  const previewKey = JSON.stringify(schedule);
  const preview = previewState?.result ?? null;
  const previewLoading = previewState?.key !== previewKey;
  React.useEffect(() => {
    const current = JSON.parse(previewKey) as ReturnType<typeof draftSchedule>;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await previewCronSchedule({
          key: job.key,
          mode: current.mode,
          tz: current.tz,
          ...(current.mode === "cron" ? { pattern: current.pattern ?? "" } : {}),
          ...(current.mode === "every" && current.everyMs ? { everyMs: current.everyMs } : {}),
        });
        if (!cancelled) setPreviewState({ key: previewKey, result });
      } catch (error) {
        if (!cancelled) {
          setPreviewState({
            key: previewKey,
            result: { valid: false, error: getApiErrorMessage(error), nextRuns: [] },
          });
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [job.key, previewKey]);

  function update(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function updatePreset(patch: Partial<CronPresetValue>) {
    setDraft((current) => {
      const preset = { ...current.preset, ...patch };
      return { ...current, preset, pattern: buildCronPattern(preset) ?? current.pattern };
    });
  }

  function updateTime(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    if (Number.isFinite(hour) && Number.isFinite(minute)) updatePreset({ hour, minute });
  }

  async function save() {
    setSaving(true);
    try {
      const saved = await updateCronJob(job.key, {
        mode: schedule.mode,
        tz: schedule.tz,
        ...(schedule.mode === "cron" ? { pattern: schedule.pattern ?? "" } : { everyMs: schedule.everyMs ?? undefined }),
      });
      toast.success(t("toasts.saved"));
      onSaved(saved);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t("toasts.failed"));
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setSaving(true);
    try {
      const restored = await resetCronJob(job.key);
      toast.success(t("toasts.reset"));
      setResetOpen(false);
      onSaved(restored);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t("toasts.failed"));
    } finally {
      setSaving(false);
    }
  }

  const tzOptions = TIME_ZONES.includes(draft.tz) ? TIME_ZONES : [draft.tz, ...TIME_ZONES];
  const preset = draft.preset;
  const note = t.has(`jobs.${job.key}.note`) ? t(`jobs.${job.key}.note`) : null;

  return (
    <div className="space-y-5">
      {job.lockedBy ? (
        <Alert>
          <Lock />
          <AlertTitle>{t("form.lockedTitle")}</AlertTitle>
          <AlertDescription>{t("form.lockedDescription", { env: job.lockedBy })}</AlertDescription>
        </Alert>
      ) : !canManage ? (
        <p className="text-sm text-muted-foreground">{t("form.readOnly")}</p>
      ) : null}

      {note ? (
        <Alert>
          <Info />
          <AlertDescription>{note}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label>{t("form.mode")}</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={draft.mode}
          disabled={disabled}
          onValueChange={(value) => value && update({ mode: value as CronScheduleMode })}
          className="w-full"
        >
          <ToggleGroupItem value="every" className="flex-1">{t("form.modeEvery")}</ToggleGroupItem>
          <ToggleGroupItem value="cron" className="flex-1">{t("form.modeCron")}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {draft.mode === "every" ? (
        <div className="grid gap-2">
          <Label htmlFor={`cron-every-${job.key}`}>{t("form.every")}</Label>
          <div className="flex gap-2">
            <Input
              id={`cron-every-${job.key}`}
              type="number"
              min={1}
              inputMode="numeric"
              className="w-28"
              disabled={disabled}
              value={draft.everyAmount}
              onChange={(event) => update({ everyAmount: event.target.value })}
            />
            <Select value={draft.everyUnit} disabled={disabled} onValueChange={(value) => update({ everyUnit: value as EveryUnit })}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>{t(`form.units.${unit}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t("form.preset")}</Label>
              <Select
                value={preset.preset}
                disabled={disabled}
                onValueChange={(value) => updatePreset({ preset: value as CronPreset })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRESETS.map((value) => (
                    <SelectItem key={value} value={value}>{t(`form.presets.${value}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {preset.preset === "hourly" ? (
              <div className="grid gap-2">
                <Label htmlFor={`cron-minute-${job.key}`}>{t("form.minute")}</Label>
                <Input
                  id={`cron-minute-${job.key}`}
                  type="number"
                  min={0}
                  max={59}
                  disabled={disabled}
                  value={preset.minute}
                  onChange={(event) => updatePreset({ minute: Math.min(59, Math.max(0, Number(event.target.value) || 0)) })}
                />
              </div>
            ) : preset.preset !== "custom" ? (
              <div className="grid gap-2">
                <Label htmlFor={`cron-time-${job.key}`}>{t("form.time")}</Label>
                <Input
                  id={`cron-time-${job.key}`}
                  type="time"
                  disabled={disabled}
                  value={toTime(preset.hour, preset.minute)}
                  onChange={(event) => updateTime(event.target.value)}
                />
              </div>
            ) : null}

            {preset.preset === "weekly" ? (
              <div className="grid gap-2">
                <Label>{t("form.weekday")}</Label>
                <Select value={String(preset.weekday)} disabled={disabled} onValueChange={(value) => updatePreset({ weekday: Number(value) })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                      <SelectItem key={day} value={String(day)}>{t(`weekdays.${day}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {preset.preset === "monthly" ? (
              <div className="grid gap-2">
                <Label htmlFor={`cron-day-${job.key}`}>{t("form.day")}</Label>
                <Input
                  id={`cron-day-${job.key}`}
                  type="number"
                  min={1}
                  max={28}
                  disabled={disabled}
                  value={preset.day}
                  onChange={(event) => updatePreset({ day: Math.min(28, Math.max(1, Number(event.target.value) || 1)) })}
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`cron-pattern-${job.key}`}>{t("form.pattern")}</Label>
            <Input
              id={`cron-pattern-${job.key}`}
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
              disabled={disabled}
              value={draft.pattern}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  pattern: event.target.value,
                  preset: parseCronPreset(event.target.value),
                }))
              }
              placeholder="0 0 * * *"
            />
            <p className="text-xs text-muted-foreground">{t("form.patternHint")}</p>
          </div>

          <div className="grid gap-2">
            <Label>{t("form.tz")}</Label>
            <Select value={draft.tz} disabled={disabled} onValueChange={(value) => update({ tz: value })}>
              <SelectTrigger className="w-full sm:w-60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {tzOptions.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("form.tzHint")}</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-foreground">{t("form.preview")}</p>
          {previewLoading ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : null}
        </div>
        {preview && !preview.valid ? (
          <p className="text-sm text-destructive">{preview.error}</p>
        ) : preview ? (
          <>
            <ol className="space-y-1 text-sm tabular-nums">
              {preview.nextRuns.map((run) => (
                <li key={run} className="flex flex-wrap justify-between gap-x-3">
                  <span>{dates.absolute(run)}</span>
                  {draft.mode === "cron" ? (
                    <span className="text-xs text-muted-foreground">{draft.tz}: {dates.inZone(run, draft.tz)}</span>
                  ) : null}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("form.previewLocal")}
              {draft.mode === "every" ? ` · ${t("form.previewEstimate")}` : ""}
            </p>
          </>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {t("form.minInterval", { value: durationText(job.minIntervalMs) })}
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {t("form.defaultValue", { value: scheduleText(job.defaults) })}
        </p>
        <div className="flex gap-2">
          {job.customized && canManage && !job.lockedBy ? (
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setResetOpen(true)}>
              <RotateCcw />
              {t("form.reset")}
            </Button>
          ) : null}
          {canManage && !job.lockedBy ? (
            <Button type="button" disabled={!dirty || saving || previewLoading || !preview?.valid} onClick={save}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {saving ? t("form.saving") : t("form.save")}
            </Button>
          ) : null}
        </div>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("resetDialog.description", { value: scheduleText(job.defaults) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{t("resetDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={(event) => { event.preventDefault(); void reset(); }}>
              {t("resetDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { Lock, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { CronJob } from "../types";
import { CronJobRuns } from "./cron-job-runs";
import { CronJobScheduleForm } from "./cron-job-schedule-form";
import { LateBadge, RunStatusBadge, useDateFormat, useScheduleText } from "./cron-job-ui";

export function CronJobSheet({
  job,
  open,
  onOpenChange,
  canManage,
  busy,
  runsRefreshToken,
  onToggle,
  onRunNow,
  onSaved,
}: {
  job: CronJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  busy: boolean;
  runsRefreshToken: number;
  onToggle: (job: CronJob, enabled: boolean) => void;
  onRunNow: (job: CronJob) => void;
  onSaved: (job: CronJob) => void;
}) {
  const t = useTranslations("Admin.cronJobs");
  const dates = useDateFormat();
  const scheduleText = useScheduleText();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        {job ? (
          <>
            <SheetHeader className="border-b border-border">
              <SheetTitle className="pr-6">{t(`jobs.${job.key}.name`)}</SheetTitle>
              <SheetDescription>{t(`jobs.${job.key}.description`)}</SheetDescription>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Badge variant="outline" className="font-mono text-[11px]">{job.queue}</Badge>
                {job.customized ? <Badge variant="secondary">{t("badges.customized")}</Badge> : null}
                {job.lockedBy ? (
                  <Badge variant="outline"><Lock />{t("badges.locked")}</Badge>
                ) : null}
                {job.running ? <RunStatusBadge status="running" /> : null}
                {job.late ? <LateBadge /> : null}
              </div>
            </SheetHeader>

            <div className="space-y-5 p-4">
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor={`cron-enabled-${job.key}`}>{t("form.enabledLabel")}</Label>
                  <p className="text-xs text-muted-foreground">{t("form.enabledHint")}</p>
                </div>
                <Switch
                  id={`cron-enabled-${job.key}`}
                  checked={job.enabled}
                  disabled={!canManage || Boolean(job.lockedBy) || busy}
                  onCheckedChange={(checked) => onToggle(job, checked)}
                />
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">{t("table.schedule")}</dt>
                  <dd className="mt-0.5 text-foreground">{job.enabled ? scheduleText(job) : t("table.disabled")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("detail.nextRun")}</dt>
                  <dd className="mt-0.5 tabular-nums text-foreground">
                    {job.nextRunAt ? dates.absolute(job.nextRunAt) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("table.lastRun")}</dt>
                  <dd className="mt-0.5 flex items-center gap-2">
                    {job.lastRun ? (
                      <>
                        <RunStatusBadge status={job.lastRun.status} />
                        <span className="text-xs text-muted-foreground">{dates.relative(job.lastRun.startedAt)}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{t("table.never")}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("detail.lastSuccess")}</dt>
                  <dd className="mt-0.5 tabular-nums text-foreground">
                    {job.lastSuccessAt ? dates.absolute(job.lastSuccessAt) : t("detail.never")}
                  </dd>
                </div>
              </dl>

              {job.manualRun && canManage ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={busy || job.running || Boolean(job.lockedBy)}
                  onClick={() => onRunNow(job)}
                >
                  <Play />
                  {t("actions.runNow")}
                </Button>
              ) : null}

              <Tabs defaultValue="config">
                <TabsList className="w-full">
                  <TabsTrigger value="config">{t("tabs.config")}</TabsTrigger>
                  <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
                </TabsList>
                <TabsContent value="config" className="pt-3">
                  <CronJobScheduleForm
                    key={`${job.key}:${job.mode}:${job.pattern}:${job.everyMs}:${job.tz}:${job.updatedAt}`}
                    job={job}
                    canManage={canManage}
                    onSaved={onSaved}
                  />
                  {job.updatedAt ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {job.updatedBy
                        ? t("form.updatedBy", { time: dates.absolute(job.updatedAt), name: job.updatedBy.name })
                        : t("form.updatedAt", { time: dates.absolute(job.updatedAt) })}
                    </p>
                  ) : null}
                </TabsContent>
                <TabsContent value="history" className="pt-3">
                  <CronJobRuns
                    jobKey={job.key}
                    refreshToken={runsRefreshToken}
                    canRetry={canManage && job.manualRun && !job.lockedBy && !job.running}
                    onRetry={() => onRunNow(job)}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

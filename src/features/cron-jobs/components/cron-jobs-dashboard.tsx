"use client";

import { Activity, ChevronRight, Lock, Play, RefreshCw, ServerOff } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getApiErrorMessage } from "@/lib/api-response";

import { getCronJobsOverviewClient, runCronJobNow, updateCronJob } from "../api/cron-jobs.client";
import { formatDurationShort } from "../schedule-format";
import type { CronJob, CronJobKey, CronJobsOverview } from "../types";
import { CronJobSheet } from "./cron-job-sheet";
import { LateBadge, RunStatusBadge, useDateFormat, useScheduleText } from "./cron-job-ui";

const AUTO_REFRESH_MS = 30_000;

export function CronJobsDashboard({
  initialOverview,
  canManage,
}: {
  initialOverview: CronJobsOverview;
  canManage: boolean;
}) {
  const t = useTranslations("Admin.cronJobs");
  const dates = useDateFormat();
  const scheduleText = useScheduleText();
  const [overview, setOverview] = React.useState(initialOverview);
  const [refreshing, setRefreshing] = React.useState(false);
  const [busyKey, setBusyKey] = React.useState<CronJobKey | null>(null);
  const [selectedKey, setSelectedKey] = React.useState<CronJobKey | null>(null);
  const [pendingDisable, setPendingDisable] = React.useState<CronJob | null>(null);
  const [runsRefreshToken, setRunsRefreshToken] = React.useState(0);

  const refresh = React.useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      setOverview(await getCronJobsOverviewClient());
      setRunsRefreshToken((value) => value + 1);
    } catch (error) {
      if (!silent) toast.error(getApiErrorMessage(error));
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh(true);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  function replaceJob(job: CronJob) {
    setOverview((current) => ({
      ...current,
      jobs: current.jobs.map((entry) => (entry.key === job.key ? job : entry)),
    }));
  }

  async function setEnabled(job: CronJob, enabled: boolean) {
    setBusyKey(job.key);
    try {
      replaceJob(await updateCronJob(job.key, { enabled }));
      toast.success(t(enabled ? "toasts.enabled" : "toasts.disabled", { name: t(`jobs.${job.key}.name`) }));
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t("toasts.failed"));
    } finally {
      setBusyKey(null);
    }
  }

  function requestToggle(job: CronJob, enabled: boolean) {
    if (!enabled && job.critical) {
      setPendingDisable(job);
      return;
    }
    void setEnabled(job, enabled);
  }

  async function runNow(job: CronJob) {
    setBusyKey(job.key);
    try {
      await runCronJobNow(job.key);
      toast.success(t("toasts.queued", { name: t(`jobs.${job.key}.name`) }));
      replaceJob({ ...job, running: true });
      window.setTimeout(() => void refresh(true), 3_000);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t("toasts.failed"));
    } finally {
      setBusyKey(null);
    }
  }

  const selectedJob = overview.jobs.find((job) => job.key === selectedKey) ?? null;
  const worker = overview.worker;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {worker.alive ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {t("worker.alive")}
            {worker.lastHeartbeatAt ? (
              <span className="text-xs">· {t("worker.aliveAt", { time: dates.relative(worker.lastHeartbeatAt) })}</span>
            ) : null}
          </p>
        ) : (
          <span />
        )}
        <Button type="button" variant="outline" size="sm" disabled={refreshing} onClick={() => refresh()}>
          <RefreshCw className={refreshing ? "animate-spin" : undefined} />
          {t("refresh")}
        </Button>
      </div>

      {!worker.alive ? (
        <Alert variant="destructive">
          <ServerOff />
          <AlertTitle>{t("worker.downTitle")}</AlertTitle>
          <AlertDescription>
            {t("worker.downDescription", {
              time: worker.lastHeartbeatAt
                ? t("worker.since", { time: dates.absolute(worker.lastHeartbeatAt) })
                : t("worker.never"),
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-64">{t("table.job")}</TableHead>
              <TableHead className="min-w-44">{t("table.schedule")}</TableHead>
              <TableHead className="min-w-44">{t("table.lastRun")}</TableHead>
              <TableHead className="min-w-36">{t("table.nextRun")}</TableHead>
              <TableHead className="w-16 text-center">{t("table.enabled")}</TableHead>
              <TableHead className="w-24 text-right"><span className="sr-only">{t("table.actions")}</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.jobs.map((job) => {
              const name = t(`jobs.${job.key}.name`);
              const busy = busyKey === job.key;
              return (
                <TableRow
                  key={job.key}
                  className="cursor-pointer"
                  onClick={() => setSelectedKey(job.key)}
                >
                  <TableCell className="whitespace-normal">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                        <Activity className="size-4" />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{t(`jobs.${job.key}.description`)}</p>
                        {job.customized || job.lockedBy ? (
                          <div className="flex flex-wrap gap-1">
                            {job.customized ? <Badge variant="secondary">{t("badges.customized")}</Badge> : null}
                            {job.lockedBy ? (
                              <Badge variant="outline"><Lock />{t("badges.locked")}</Badge>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal text-sm">
                    {job.enabled ? scheduleText(job) : <span className="text-muted-foreground">{t("table.disabled")}</span>}
                  </TableCell>
                  <TableCell>
                    {job.running ? (
                      <RunStatusBadge status="running" />
                    ) : job.lastRun ? (
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <RunStatusBadge status={job.lastRun.status} />
                          {job.late ? <LateBadge /> : null}
                        </div>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {dates.relative(job.lastRun.startedAt)}
                          {job.lastRun.durationMs !== null ? ` · ${formatDurationShort(job.lastRun.durationMs)}` : ""}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t("table.never")}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {job.nextRunAt ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{dates.relative(job.nextRunAt)}</span>
                        </TooltipTrigger>
                        <TooltipContent>{dates.absolute(job.nextRunAt)}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center" onClick={(event) => event.stopPropagation()}>
                    <Switch
                      checked={job.enabled}
                      disabled={!canManage || Boolean(job.lockedBy) || busy}
                      onCheckedChange={(checked) => requestToggle(job, checked)}
                      aria-label={`${t("table.enabled")} ${name}`}
                    />
                  </TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      {canManage && job.manualRun ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={busy || job.running || Boolean(job.lockedBy)}
                              onClick={() => runNow(job)}
                              aria-label={`${t("actions.runNow")} ${name}`}
                            >
                              <Play />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("actions.runNow")}</TooltipContent>
                        </Tooltip>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSelectedKey(job.key)}
                        aria-label={`${t("actions.details")} ${name}`}
                      >
                        <ChevronRight />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CronJobSheet
        job={selectedJob}
        open={Boolean(selectedJob)}
        onOpenChange={(open) => !open && setSelectedKey(null)}
        canManage={canManage}
        busy={busyKey === selectedJob?.key}
        runsRefreshToken={runsRefreshToken}
        onToggle={requestToggle}
        onRunNow={runNow}
        onSaved={replaceJob}
      />

      <AlertDialog open={Boolean(pendingDisable)} onOpenChange={(open) => !open && setPendingDisable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDisable ? t("disableDialog.title", { name: t(`jobs.${pendingDisable.key}.name`) }) : null}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDisable ? t(`jobs.${pendingDisable.key}.disableWarning`) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("disableDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const job = pendingDisable;
                setPendingDisable(null);
                if (job) void setEnabled(job, false);
              }}
            >
              {t("disableDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

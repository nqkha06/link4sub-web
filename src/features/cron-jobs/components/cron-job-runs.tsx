"use client";

import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-response";

import { getCronJobRuns } from "../api/cron-jobs.client";
import { formatDurationShort } from "../schedule-format";
import type { CronJobKey, CronJobRun } from "../types";
import { RunStatusBadge, TriggerLabel, useDateFormat } from "./cron-job-ui";

type StatusFilter = "all" | "running" | "completed" | "failed";
const FILTERS: StatusFilter[] = ["all", "completed", "failed", "running"];
const PER_PAGE = 15;

export function CronJobRuns({
  jobKey,
  refreshToken,
  canRetry,
  onRetry,
}: {
  jobKey: CronJobKey;
  /** Đổi giá trị để tải lại (vd. sau khi chạy tay). */
  refreshToken: number;
  canRetry: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations("Admin.cronJobs");
  const dates = useDateFormat();
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [page, setPage] = React.useState(1);
  const [reloadToken, setReloadToken] = React.useState(0);
  const [loaded, setLoaded] = React.useState<{
    key: string;
    runs: CronJobRun[] | null;
    totalPages: number;
    error: string | null;
  } | null>(null);

  // Kết quả gắn với bộ lọc đã tải; khác khóa hiện tại nghĩa là đang tải.
  const requestKey = `${jobKey}:${page}:${status}:${refreshToken}:${reloadToken}`;
  const loading = loaded?.key !== requestKey;
  const runs = loaded?.runs ?? null;
  const totalPages = loaded?.totalPages ?? 1;
  const error = loaded?.key === requestKey ? loaded.error : null;

  React.useEffect(() => {
    let cancelled = false;
    getCronJobRuns(jobKey, { page, perPage: PER_PAGE, status })
      .then((response) => {
        if (!cancelled) {
          setLoaded({ key: requestKey, runs: response.data, totalPages: response.meta.totalPages, error: null });
        }
      })
      .catch((failure: unknown) => {
        if (!cancelled) {
          setLoaded((current) => ({
            key: requestKey,
            runs: current?.runs ?? [],
            totalPages: current?.totalPages ?? 1,
            error: getApiErrorMessage(failure),
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [jobKey, page, status, requestKey]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40" aria-label={t("history.filter")}><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILTERS.map((value) => (
              <SelectItem key={value} value={value}>
                {value === "all" ? t("history.all") : t(`status.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={loading}
          onClick={() => setReloadToken((value) => value + 1)}
          aria-label={t("refresh")}
        >
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {runs === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}
        </div>
      ) : runs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("history.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {runs.map((run) => (
            <li key={run.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 text-sm outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <p className="tabular-nums text-foreground">{dates.absolute(run.startedAt)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      <TriggerLabel run={run} />
                      {run.attempt > 1 ? ` · ${t("history.attempt", { count: run.attempt })}` : ""}
                    </p>
                  </div>
                  <span className="hidden w-20 text-right text-xs tabular-nums text-muted-foreground sm:block">
                    {run.durationMs !== null ? formatDurationShort(run.durationMs) : "—"}
                  </span>
                  <RunStatusBadge status={run.status} />
                </summary>
                <div className="space-y-2 border-t border-border bg-muted/20 px-3 py-3 text-xs">
                  <p className="text-muted-foreground sm:hidden">
                    {t("history.duration")}: {run.durationMs !== null ? formatDurationShort(run.durationMs) : "—"}
                  </p>
                  {run.error ? (
                    <div>
                      <p className="mb-1 font-medium text-destructive">{t("history.error")}</p>
                      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-background p-2 font-mono text-destructive">{run.error}</pre>
                    </div>
                  ) : null}
                  {run.result !== null && run.result !== undefined ? (
                    <div>
                      <p className="mb-1 font-medium text-foreground">{t("history.result")}</p>
                      <pre className="max-h-48 overflow-auto rounded-md bg-background p-2 font-mono text-muted-foreground">{JSON.stringify(run.result, null, 2)}</pre>
                    </div>
                  ) : null}
                  {run.status === "failed" && canRetry ? (
                    <Button type="button" size="sm" variant="outline" onClick={onRetry}>
                      <RefreshCw />
                      {t("actions.retry")}
                    </Button>
                  ) : null}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t("history.retention")}</p>
        {totalPages > 1 ? (
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon-sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} aria-label={t("history.prev")}>
              <ChevronLeft />
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">{t("history.page", { page, total: totalPages })}</span>
            <Button type="button" variant="ghost" size="icon-sm" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} aria-label={t("history.next")}>
              <ChevronRight />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import {
  authenticatedApiRequest,
  authenticatedPaginatedApiRequest,
} from "@/lib/api-client";

import type {
  CronJob,
  CronJobKey,
  CronJobRun,
  CronJobRunStatus,
  CronJobsOverview,
  CronSchedulePreview,
  CronScheduleMode,
  UpdateCronJobInput,
} from "../types";

const JSON_HEADERS = { "Content-Type": "application/json" };

export function getCronJobsOverviewClient() {
  return authenticatedApiRequest<CronJobsOverview>("/admin/cron-jobs");
}

export function updateCronJob(key: CronJobKey, input: UpdateCronJobInput) {
  return authenticatedApiRequest<CronJob>(`/admin/cron-jobs/${key}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export function resetCronJob(key: CronJobKey) {
  return authenticatedApiRequest<CronJob>(`/admin/cron-jobs/${key}/reset`, {
    method: "POST",
  });
}

export function runCronJobNow(key: CronJobKey) {
  return authenticatedApiRequest<{ jobId: string; queuedAt: string }>(
    `/admin/cron-jobs/${key}/run`,
    { method: "POST" },
  );
}

export function previewCronSchedule(input: {
  key: CronJobKey;
  mode: CronScheduleMode;
  pattern?: string;
  everyMs?: number;
  tz: string;
}) {
  return authenticatedApiRequest<CronSchedulePreview>("/admin/cron-jobs/preview", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export function getCronJobRuns(
  key: CronJobKey,
  params: { page: number; perPage?: number; status?: CronJobRunStatus | "all" },
) {
  const search = new URLSearchParams({
    page: String(params.page),
    perPage: String(params.perPage ?? 20),
  });
  if (params.status && params.status !== "all" && params.status !== "interrupted") {
    search.set("status", params.status);
  }
  return authenticatedPaginatedApiRequest<CronJobRun>(
    `/admin/cron-jobs/${key}/runs?${search.toString()}`,
  );
}

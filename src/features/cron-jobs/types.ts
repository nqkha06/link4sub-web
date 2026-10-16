export type CronJobKey = "visit_aggregation" | "loyalty_rollup" | "system_log_cleanup" | "link_cleanup";
export type CronScheduleMode = "cron" | "every";
export type CronJobRunStatus = "running" | "completed" | "failed" | "interrupted";

export type CronJobConfig = {
  enabled: boolean;
  mode: CronScheduleMode;
  pattern: string | null;
  everyMs: number | null;
  tz: string;
};

export type CronJobRun = {
  id: number;
  trigger: "schedule" | "manual" | string;
  status: CronJobRunStatus;
  attempt: number;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  error: string | null;
  result: unknown;
  triggeredBy: { id: number; name: string } | null;
};

export type CronJob = CronJobConfig & {
  key: CronJobKey;
  queue: string;
  defaults: CronJobConfig;
  customized: boolean;
  /** Tên biến env đang khóa job; null nếu admin sửa được. */
  lockedBy: string | null;
  critical: boolean;
  manualRun: boolean;
  minIntervalMs: number;
  expectedIntervalMs: number | null;
  nextRunAt: string | null;
  running: boolean;
  late: boolean;
  lastRun: CronJobRun | null;
  lastSuccessAt: string | null;
  updatedAt: string | null;
  updatedBy: { id: number; name: string } | null;
};

export type CronWorkerStatus = {
  lastHeartbeatAt: string | null;
  alive: boolean;
  staleAfterMs: number;
};

export type CronJobsOverview = {
  worker: CronWorkerStatus;
  jobs: CronJob[];
};

export type CronSchedulePreview = {
  valid: boolean;
  error: string | null;
  nextRuns: string[];
};

export type UpdateCronJobInput = Partial<
  Pick<CronJobConfig, "enabled" | "mode" | "pattern" | "everyMs" | "tz">
>;

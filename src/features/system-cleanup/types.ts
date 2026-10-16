export const SYSTEM_CLEANUP_TARGETS = [
  "expired_sessions",
  "password_reset_tokens",
  "email_verification_tokens",
  "system_logs",
  "access_logs",
  "audit_logs",
  "email_history",
  "worker_log_files",
] as const;

export type SystemCleanupTarget = (typeof SYSTEM_CLEANUP_TARGETS)[number];

export type SystemCleanupInventoryItem = {
  target: SystemCleanupTarget;
  totalCount: number;
  eligibleCount: number;
};

export type SystemCleanupOverview = {
  generatedAt: string;
  olderThanDays: number;
  cutoff: string;
  items: SystemCleanupInventoryItem[];
  protectedData: string[];
};

export type SystemCleanupResult = {
  startedAt: string;
  completedAt: string;
  olderThanDays: number;
  cutoff: string;
  deletedCount: number;
  results: Array<{
    target: SystemCleanupTarget;
    deletedCount: number;
  }>;
};

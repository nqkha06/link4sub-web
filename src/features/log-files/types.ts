export type LogChannel = "queue" | "worker";
export type LogLevel = "debug" | "info" | "warning" | "error";

export type LogFile = {
  name: string;
  channel: LogChannel;
  /** YYYY-MM-DD (UTC) */
  date: string;
  sizeBytes: number;
  modifiedAt: string;
};

export type LogFilesListing = {
  channels: LogChannel[];
  levels: LogLevel[];
  retentionDays: number;
  totalSizeBytes: number;
  files: LogFile[];
};

export type LogEntry = {
  index: number;
  timestamp: string;
  environment: string;
  level: LogLevel;
  context: string | null;
  message: string;
  meta: Record<string, unknown> | null;
  stack: string | null;
};

export type LogEntriesResponse = Omit<
  import("@/contracts").PaginatedApiResponse<LogEntry>,
  "meta"
> & {
  meta: import("@/contracts").PaginationMeta & {
    file: LogFile;
    truncated: boolean;
    levelCounts: Record<LogLevel, number>;
  };
};

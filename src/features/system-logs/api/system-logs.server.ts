import "server-only";

import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData, readPaginatedApiResponse } from "@/lib/api-response";

import type { SystemLogsQuery } from "../query/system-logs-search-params";
import type {
  SystemLogSettings,
  SystemLogsResponse,
  SystemLogStats,
} from "../types";

function serialize(query: SystemLogsQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    perPage: String(query.perPage),
    sortOrder: "desc",
  });
  for (const key of ["level", "category", "context", "event", "user", "keyword", "from", "to"] as const) {
    const value = query[key];
    if (value) params.set(key, String(value));
  }
  return params.toString();
}

async function get<T>(path: string) {
  const response = await serverApiFetch(path, { cache: "no-store" });
  return readApiData<T>(response);
}

export async function getSystemLogs(query: SystemLogsQuery) {
  const response = await serverApiFetch(
    `/admin/system-logs?${serialize(query)}`,
    { cache: "no-store" },
  );
  return readPaginatedApiResponse<SystemLogsResponse["data"][number]>(response);
}
export const getSystemLogStats = () => get<SystemLogStats>("/admin/system-logs/stats");
export const getSystemLogSettings = () =>
  get<SystemLogSettings>("/admin/system-log-settings");

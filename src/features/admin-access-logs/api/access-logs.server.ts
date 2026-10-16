import "server-only";

import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData, readPaginatedApiResponse } from "@/lib/api-response";

import { serializeAccessLogsQuery } from "./access-logs-query-serializer";
import type { AccessLogsTableQuery } from "../query/access-logs-search-params";
import type {
  AccessLogsStats,
  AdminAccessLogsResponse,
  UserAccessAnalysis,
} from "../types";

export async function getAdminAccessLogs(state: AccessLogsTableQuery) {
  const response = await serverApiFetch(
    `/admin/stu-access-logs?${serializeAccessLogsQuery(state)}`,
    { cache: "no-store" },
  );
  return readPaginatedApiResponse<AdminAccessLogsResponse["data"][number]>(response) as Promise<AdminAccessLogsResponse>;
}

export async function getAdminAccessLogStats() {
  const response = await serverApiFetch(
    "/admin/stu-access-logs/stats",
    { cache: "no-store" },
  );
  return readApiData<AccessLogsStats>(response);
}

export async function getUserAccessAnalysis(
  userId: number,
  period: { from?: string | null; to?: string | null },
) {
  const query = new URLSearchParams();
  if (period.from) query.set("from", period.from);
  if (period.to) query.set("to", period.to);
  const response = await serverApiFetch(
    `/admin/users/${userId}/access-analysis?${query.toString()}`,
    { cache: "no-store" },
  );
  return readApiData<UserAccessAnalysis>(response);
}

export async function getUserAccessLogs(
  userId: number,
  input: { from?: string | null; to?: string | null; page?: number },
) {
  const query = new URLSearchParams({
    page: String(input.page || 1),
    perPage: "20",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  if (input.from) query.set("from", input.from);
  if (input.to) query.set("to", input.to);
  const response = await serverApiFetch(
    `/admin/users/${userId}/access-logs?${query.toString()}`,
    { cache: "no-store" },
  );
  return readPaginatedApiResponse<AdminAccessLogsResponse["data"][number]>(response) as Promise<AdminAccessLogsResponse>;
}

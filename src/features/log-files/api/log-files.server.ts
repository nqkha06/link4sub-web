import "server-only";

import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData, readPaginatedApiResponse } from "@/lib/api-response";

import type { LogFilesQuery } from "../query/log-files-search-params";
import type { LogEntriesResponse, LogFilesListing } from "../types";

export async function getLogFiles() {
  const response = await serverApiFetch("/admin/log-files", { cache: "no-store" });
  return readApiData<LogFilesListing>(response);
}

/** Trả về null khi file đã bị xóa/không tồn tại. */
export async function getLogEntries(name: string, query: LogFilesQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    perPage: String(query.perPage),
    order: query.order,
  });
  if (query.level) params.set("level", query.level);
  if (query.q) params.set("search", query.q);
  const response = await serverApiFetch(
    `/admin/log-files/${encodeURIComponent(name)}?${params}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  return readPaginatedApiResponse<LogEntriesResponse["data"][number]>(response) as Promise<LogEntriesResponse>;
}

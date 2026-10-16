"use client";

import { authenticatedApiRequest } from "@/lib/api-client";

async function request<T>(path: string, init?: RequestInit) {
  return authenticatedApiRequest<T>(path, init);
}

export const deleteLogFile = (name: string) =>
  request<{ deletedCount: number }>(`/admin/log-files/${encodeURIComponent(name)}`, { method: "DELETE" });

export const cleanupLogFiles = (olderThanDays: number) =>
  request<{ deletedCount: number }>("/admin/log-files/cleanup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ olderThanDays }),
  });

/** Link tải file gốc, đi qua BFF cùng origin nên tự mang cookie đăng nhập. */
export const logFileDownloadUrl = (name: string) =>
  `/api/backend/admin/log-files/${encodeURIComponent(name)}/download`;

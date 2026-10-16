"use client";

import { authenticatedApiRequest } from "@/lib/api-client";

import type { SystemLogDetail, SystemLogSettings } from "../types";

async function request<T>(path: string, init?: RequestInit) {
  return authenticatedApiRequest<T>(path, init);
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export const getSystemLog = (id: number) => request<SystemLogDetail>(`/admin/system-logs/${encodeURIComponent(id)}`);
export const deleteSystemLog = (id: number) => request<{ deletedCount: number }>(`/admin/system-logs/${encodeURIComponent(id)}`, { method: "DELETE" });
export const bulkDeleteSystemLogs = (ids: number[]) => request<{ deletedCount: number }>("/admin/system-logs/bulk-delete", json("POST", { ids }));
export const cleanupSystemLogs = (input: Record<string, unknown>) => request<{ dryRun: boolean; matchedCount: number; deletedCount: number }>("/admin/system-logs/cleanup", json("POST", input));
export const updateSystemLogSettings = (input: { globalRetentionDays: number; rules: Array<{ scope: string; retentionDays: number; enabled: boolean }> }) => request<SystemLogSettings>("/admin/system-log-settings", json("PUT", input));
export const createSystemLogCategory = (input: { key: string; name: string; description?: string; isActive: boolean; sortOrder: number }) => request("/admin/system-log-categories", json("POST", input));
export const updateSystemLogCategory = (id: number, input: { name?: string; description?: string; isActive?: boolean; sortOrder?: number }) => request(`/admin/system-log-categories/${id}`, json("PATCH", input));

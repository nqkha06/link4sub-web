"use client";

import { authenticatedApiRequest } from "@/lib/api-client";

import type { AdminAccessLogDetail } from "../types";

export async function getAdminAccessLog(id: number) {
  return request<AdminAccessLogDetail>(
    `/admin/stu-access-logs/${encodeURIComponent(id)}`,
  );
}

async function request<T>(path: string, init?: RequestInit) {
  return authenticatedApiRequest<T>(path, init);
}

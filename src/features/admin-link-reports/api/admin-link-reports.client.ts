"use client";

import { authenticatedApiRequest } from "@/lib/api-client";
import type { AdminLinkReport, LinkReportStatus } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return authenticatedApiRequest<T>(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
}

export function getAdminLinkReport(id: number) {
  return request<AdminLinkReport>(`/admin/link-reports/${id}`, {
    cache: "no-store",
  });
}

export function updateAdminLinkReport(
  id: number,
  input: { status: LinkReportStatus; resolutionNote?: string },
) {
  return request<AdminLinkReport>(`/admin/link-reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAdminLinkReport(id: number) {
  return request<{ deleted: number }>(`/admin/link-reports/${id}`, {
    method: "DELETE",
  });
}

export function updateAdminLinkReportsStatus(
  ids: number[],
  status: LinkReportStatus,
) {
  return request<{ updated: number }>("/admin/link-reports/bulk/status", {
    method: "PATCH",
    body: JSON.stringify({ ids, status }),
  });
}

export function deleteAdminLinkReports(ids: number[]) {
  return request<{ deleted: number }>("/admin/link-reports/bulk", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}

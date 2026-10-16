"use client"

import type {
  AdminSocialLink,
  AdminSocialLinkPayload,
  AdminSocialLinkStatus,
  AdminSocialLinksStatistics,
} from "@/features/admin-social-links/types"
import { authenticatedApiRequest } from "@/lib/api-client"

export async function updateAdminSocialLink(
  id: number,
  payload: AdminSocialLinkPayload,
) {
  return request<AdminSocialLink>(`/admin/social-links/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function updateAdminSocialLinksStatus(
  ids: number[],
  status: AdminSocialLinkStatus,
) {
  return request<{ updated: number }>("/admin/social-links/bulk/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, status }),
  })
}

export async function deleteAdminSocialLinks(ids: number[]) {
  return request<{ deleted: number }>("/admin/social-links/bulk", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  })
}

export async function restoreAdminSocialLinks(ids: number[]) {
  return request<{ restored: number }>("/admin/social-links/bulk/restore", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  })
}

export function getAdminSocialLinksStatistics(params: {
  range: AdminSocialLinksStatistics["period"]["range"]
  from?: string
  to?: string
}) {
  const searchParams = new URLSearchParams({ range: params.range })
  if (params.from) searchParams.set("from", params.from)
  if (params.to) searchParams.set("to", params.to)
  return request<AdminSocialLinksStatistics>(`/admin/social-links/statistics?${searchParams.toString()}`, {
    method: "GET",
  })
}

async function request<T>(path: string, init: RequestInit) {
  return authenticatedApiRequest<T>(path, init)
}

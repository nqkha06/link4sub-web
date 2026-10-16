"use client"

import type {
  AdminSnippet,
  AdminSnippetOwner,
  CreateAdminSnippetPayload,
  UpdateAdminSnippetPayload,
} from "@/features/admin-snippets/types"
import { authenticatedApiRequest } from "@/lib/api-client"

export function createAdminSnippet(payload: CreateAdminSnippetPayload) {
  return request<AdminSnippet>("/admin/snippets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function searchAdminSnippetOwners(search: string) {
  const query = new URLSearchParams()
  if (search.trim()) query.set("search", search.trim())
  return request<AdminSnippetOwner[]>(
    `/admin/snippets/owners${query.size ? `?${query.toString()}` : ""}`,
    { method: "GET" },
  )
}

export function updateAdminSnippet(
  id: number,
  payload: UpdateAdminSnippetPayload,
) {
  return request<AdminSnippet>(`/admin/snippets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function deleteAdminSnippets(ids: number[]) {
  return request<{ deleted: number }>("/admin/snippets/bulk", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  })
}

export function restoreAdminSnippets(ids: number[]) {
  return request<{ restored: number }>("/admin/snippets/bulk/restore", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  })
}

async function request<T>(path: string, init: RequestInit) {
  return authenticatedApiRequest<T>(path, init)
}

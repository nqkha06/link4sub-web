"use client";

import type {
  AdminMedia,
  AdminMediaFolder,
  AdminMediaQuery,
  AdminMediaResponse,
} from "@/features/admin-media/types";
import { authenticatedApiRequest, authenticatedPaginatedApiRequest } from "@/lib/api-client";

export async function getAdminMedia(params: AdminMediaQuery = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.type) query.set("type", params.type);
  if (params.folderId !== undefined) {
    query.set("folderId", String(params.folderId ?? "root"));
  }
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  return authenticatedPaginatedApiRequest<AdminMedia>(
    `/admin/media${query.size ? `?${query}` : ""}`,
  ) as Promise<AdminMediaResponse>;
}

export function getAdminMediaById(id: number) {
  return request<AdminMedia>(`/admin/media/${encodeURIComponent(id)}`);
}

export async function uploadAdminMedia(
  files: File[],
  folderId?: number | null,
) {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));
  const query = new URLSearchParams({
    folderId: folderId ? String(folderId) : "root",
  });
  return request<AdminMedia[]>(
    `/admin/media/upload?${query}`,
    { method: "POST", body },
  );
}

export function updateAdminMedia(
  id: number,
  payload: {
    fileName?: string;
    altText?: string | null;
    caption?: string | null;
  },
) {
  return jsonRequest<AdminMedia>(
    `/admin/media/${encodeURIComponent(id)}`,
    "PATCH",
    payload,
  );
}

export function moveAdminMedia(id: number, folderId: number | null) {
  return jsonRequest<AdminMedia>(
    `/admin/media/${encodeURIComponent(id)}/move`,
    "PATCH",
    { folderId },
  );
}

export function bulkMoveAdminMedia(ids: number[], folderId: number | null) {
  return jsonRequest<{ moved: number; folderId: number | null }>(
    "/admin/media/bulk-move",
    "POST",
    { ids, folderId },
  );
}

export function deleteAdminMedia(id: number) {
  return request<{ id: number; deleted: true }>(
    `/admin/media/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function bulkDeleteAdminMedia(ids: number[]) {
  return jsonRequest<{ deleted: number }>(
    "/admin/media/bulk-delete",
    "POST",
    { ids },
  );
}

export async function getAdminMediaFolders() {
  return request<AdminMediaFolder[]>("/admin/media/folders");
}

export function createAdminMediaFolder(payload: {
  name: string;
  parentId?: number | null;
}) {
  return jsonRequest<AdminMediaFolder>(
    "/admin/media/folders",
    "POST",
    payload,
  );
}

export function updateAdminMediaFolder(
  id: number,
  payload: { name?: string; parentId?: number | null },
) {
  return jsonRequest<AdminMediaFolder>(
    `/admin/media/folders/${encodeURIComponent(id)}`,
    "PATCH",
    payload,
  );
}

export function deleteAdminMediaFolder(id: number) {
  return request<{ id: number; deleted: true }>(
    `/admin/media/folders/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

async function jsonRequest<T>(
  path: string,
  method: "POST" | "PATCH",
  body: object,
) {
  return request<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function request<T>(path: string, init: RequestInit = {}) {
  return authenticatedApiRequest<T>(path, init);
}

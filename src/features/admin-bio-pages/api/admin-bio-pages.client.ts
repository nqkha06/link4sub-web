"use client";

import { authenticatedApiRequest } from "@/lib/api-client";
import type { AdminBioPageListItem, BioPageStatus } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return authenticatedApiRequest<T>(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
}

export function getAdminBioPage(id: number) {
  return request<AdminBioPageListItem>(`/admin/bio-pages/${id}`, {
    cache: "no-store",
  });
}

export function updateAdminBioPageStatus(id: number, status: BioPageStatus) {
  return request<AdminBioPageListItem>(`/admin/bio-pages/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteAdminBioPage(id: number) {
  return request<{ id: number; deleted: true }>(`/admin/bio-pages/${id}`, {
    method: "DELETE",
  });
}

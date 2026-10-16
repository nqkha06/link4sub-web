"use client";

import type {
  AdminRole,
  RolePayload,
} from "@/features/admin-authorization/types";
import { authenticatedApiRequest } from "@/lib/api-client";

export function createRole(payload: RolePayload & { key: string }) {
  return request<AdminRole>("/admin/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateRole(id: number, payload: RolePayload) {
  const body = { ...payload };
  delete body.key;
  return request<AdminRole>(`/admin/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteRole(id: number) {
  return request<{ id: number; deleted: true }>(`/admin/roles/${id}`, {
    method: "DELETE",
  });
}

async function request<T>(path: string, init: RequestInit) {
  return authenticatedApiRequest<T>(path, init);
}

"use client";

import type {
  AdminUserDetail,
  AdminUserSession,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
  UserStatus,
  UsersStatistics,
} from "@/features/admin-users/types";
import { authenticatedApiRequest } from "@/lib/api-client";

export function createAdminUser(payload: CreateAdminUserPayload) {
  return request<AdminUserDetail>("/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateAdminUser(id: number, payload: UpdateAdminUserPayload) {
  return request<AdminUserDetail>(`/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateAdminUserStatus(id: number, status: UserStatus) {
  return request<AdminUserDetail>(`/admin/users/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function updateAdminUsersStatus(ids: number[], status: UserStatus) {
  return request<{ updated: number }>("/admin/users/bulk/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, status }),
  });
}

export function deleteAdminUsers(ids: number[]) {
  return request<{ deleted: number }>("/admin/users/bulk", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

export function revokeAdminUserSessions(id: number) {
  return request<{ id: number; revokedSessions: number }>(
    `/admin/users/${id}/revoke-sessions`,
    { method: "POST" },
  );
}

export function getAdminUserSessions(id: number) {
  return request<AdminUserSession[]>(`/admin/users/${id}/sessions`, {
    method: "GET",
  });
}

export function revokeAdminUserSession(id: number, sessionId: number) {
  return request<{
    id: number;
    sessionId: number;
    revoked: boolean;
  }>(`/admin/users/${id}/sessions/${encodeURIComponent(sessionId)}/revoke`, {
    method: "POST",
  });
}

export function getAdminUsersStatistics() {
  return request<UsersStatistics>("/admin/users/statistics", {
    method: "GET",
  });
}

export async function impersonateAdminUser(id: number) {
  await authenticatedApiRequest<unknown>(`/auth/impersonation/${id}`, {
    method: "POST",
  });
  window.location.assign("/member");
}

async function request<T>(path: string, init: RequestInit) {
  return authenticatedApiRequest<T>(path, init);
}

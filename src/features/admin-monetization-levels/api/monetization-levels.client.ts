"use client";

import type {
  AdminMonetizationLevel,
  AdminMonetizationLevelPayload,
} from "@/features/admin-monetization-levels/types";
import { authenticatedApiRequest } from "@/lib/api-client";

export function createMonetizationLevel(
  payload: AdminMonetizationLevelPayload,
) {
  return request<AdminMonetizationLevel>("/admin/monetization-levels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateMonetizationLevel(
  id: number,
  payload: AdminMonetizationLevelPayload,
) {
  return request<AdminMonetizationLevel>(`/admin/monetization-levels/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteMonetizationLevel(id: number) {
  return request<{ id: number; deleted: true }>(
    `/admin/monetization-levels/${id}`,
    { method: "DELETE" },
  );
}

async function request<T>(path: string, init: RequestInit) {
  return authenticatedApiRequest<T>(path, init);
}

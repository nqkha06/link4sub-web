"use client";

import type {
  AdminLoyaltyTier,
  AdminLoyaltyTierPayload,
} from "@/features/admin-loyalty-tiers/types";
import { authenticatedApiRequest } from "@/lib/api-client";

export function createLoyaltyTier(payload: AdminLoyaltyTierPayload) {
  return request<AdminLoyaltyTier>("/admin/loyalty-tiers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateLoyaltyTier(
  id: number,
  payload: AdminLoyaltyTierPayload,
) {
  return request<AdminLoyaltyTier>(`/admin/loyalty-tiers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteLoyaltyTier(id: number) {
  return request<{ id: number; deleted: true }>(
    `/admin/loyalty-tiers/${id}`,
    { method: "DELETE" },
  );
}

async function request<T>(path: string, init: RequestInit) {
  return authenticatedApiRequest<T>(path, init);
}

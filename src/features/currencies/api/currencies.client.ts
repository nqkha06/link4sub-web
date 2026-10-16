"use client";

import { authenticatedApiRequest, authenticatedPaginatedApiRequest } from "@/lib/api-client";

import type {
  AdminCurrenciesResponse,
  Currency,
  CurrencyPayload,
  MemberCurrencyPreferences,
} from "../types";

async function request<T>(path: string, init?: RequestInit) {
  return authenticatedApiRequest<T>(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
}

export function getAdminCurrencies() {
  return authenticatedPaginatedApiRequest<Currency>("/admin/settings/currencies") as Promise<AdminCurrenciesResponse>;
}

export function createCurrency(payload: CurrencyPayload) {
  return request<Currency>("/admin/settings/currencies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCurrency(
  id: number,
  payload: Partial<Omit<CurrencyPayload, "code">>,
) {
  return request<Currency>(`/admin/settings/currencies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setDefaultCurrency(id: number) {
  return request<Currency>(`/admin/settings/currencies/${id}/default`, {
    method: "PATCH",
  });
}

export function deleteCurrency(id: number) {
  return request<{ id: number; deleted: true }>(
    `/admin/settings/currencies/${id}`,
    { method: "DELETE" },
  );
}

export function updateMemberCurrency(currency: string) {
  return request<MemberCurrencyPreferences>("/member/preferences/currency", {
    method: "PATCH",
    body: JSON.stringify({ currency }),
  });
}

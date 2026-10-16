import { authenticatedApiRequest, authenticatedPaginatedApiRequest } from "@/lib/api-client";
import { readPaginatedApiResponse } from "@/lib/api-response";

import type {
  Language,
  LanguagePayload,
  LanguagesResponse,
  PublicLanguagesResponse,
  UiTranslationsResponse,
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

export function getAdminLanguages() {
  return authenticatedPaginatedApiRequest<Language>("/admin/languages") as Promise<LanguagesResponse>;
}

export function getAdminLanguage(id: number) {
  return request<Language>(`/admin/languages/${id}`);
}

export function createLanguage(payload: LanguagePayload) {
  return request<Language>("/admin/languages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLanguage(
  id: number,
  payload: Partial<LanguagePayload>,
) {
  return request<Language>(`/admin/languages/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setDefaultLanguage(id: number) {
  return request<Language>(`/admin/languages/${id}/default`, {
    method: "PATCH",
  });
}

export function reorderLanguages(
  items: Array<{ id: number; sortOrder: number }>,
) {
  return authenticatedPaginatedApiRequest<Language>("/admin/languages/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }) as Promise<LanguagesResponse>;
}

export function deleteLanguage(id: number) {
  return request<{ id: number; deleted: true }>(`/admin/languages/${id}`, {
    method: "DELETE",
  });
}

export function getUiTranslations(id: number) {
  return request<UiTranslationsResponse>(
    `/admin/languages/${id}/ui-translations`,
  );
}

export function updateUiTranslations(
  id: number,
  payload: {
    version: number;
    catalogSize: number;
    entries: Array<{ key: string; value: string }>;
    removedKeys: string[];
  },
) {
  return request<UiTranslationsResponse>(
    `/admin/languages/${id}/ui-translations`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function getPublicLanguages() {
  const response = await fetch("/api/backend/languages", {
    credentials: "include",
  });
  return readPaginatedApiResponse<PublicLanguagesResponse["data"][number]>(
    response,
  ) as Promise<PublicLanguagesResponse>;
}

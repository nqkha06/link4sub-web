"use client";

import { authenticatedApiRequest, authenticatedPaginatedApiRequest } from "@/lib/api-client";

import type {
  LanguageOption,
  PageOption,
  WebsiteMenu,
  WebsiteMenuItem,
  WebsiteMenuLocation,
  WebsiteMenusResponse,
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

export function getMenus() {
  return authenticatedPaginatedApiRequest<WebsiteMenu>(
    "/admin/menus",
  ) as Promise<WebsiteMenusResponse>;
}

export function getMenu(id: number) {
  return request<WebsiteMenu>(`/admin/menus/${id}`);
}

export function createMenu(payload: {
  key: string;
  name: string;
  description?: string;
  translations: Array<{ locale: string; title?: string }>;
}) {
  return request<WebsiteMenu>("/admin/menus", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMenu(
  id: number,
  payload: {
    name?: string;
    description?: string;
    translations?: Array<{ locale: string; title?: string }>;
  },
) {
  return request<WebsiteMenu>(`/admin/menus/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function saveMenuTree(
  id: number,
  expectedVersion: number,
  items: WebsiteMenuItem[],
) {
  return request<WebsiteMenu>(`/admin/menus/${id}/tree`, {
    method: "PUT",
    body: JSON.stringify({
      expectedVersion,
      items: items.map(toTreePayload),
    }),
  });
}

export function publishMenu(id: number) {
  return request<WebsiteMenu>(`/admin/menus/${id}/publish`, {
    method: "POST",
  });
}

export function unpublishMenu(id: number) {
  return request<WebsiteMenu>(`/admin/menus/${id}/unpublish`, {
    method: "POST",
  });
}

export function duplicateMenu(id: number) {
  return request<WebsiteMenu>(`/admin/menus/${id}/duplicate`, {
    method: "POST",
  });
}

export function deleteMenu(id: number) {
  return request<{ id: number; deleted: true }>(`/admin/menus/${id}`, {
    method: "DELETE",
  });
}

export function assignMenuLocation(
  location: WebsiteMenuLocation,
  menuId: number,
) {
  return request("/admin/menus/locations", {
    method: "PATCH",
    body: JSON.stringify({ location, menuId }),
  });
}

export function unassignMenuLocation(location: WebsiteMenuLocation) {
  return request(`/admin/menus/locations/${location}`, {
    method: "DELETE",
  });
}

export function getMenuEditorOptions() {
  return Promise.all([
    authenticatedPaginatedApiRequest<LanguageOption>("/admin/languages"),
    authenticatedPaginatedApiRequest<PageOption>("/admin/pages?perPage=100&page=1"),
  ]).then(([languages, pages]) => ({
    languages: languages.data,
    pages: pages.data,
  }));
}

type MenuTreePayload = {
  id?: number;
  type: WebsiteMenuItem["type"];
  pageId?: number;
  url?: string;
  target: WebsiteMenuItem["target"];
  rel?: string;
  iconKey?: string;
  isEnabled: boolean;
  translations: Array<{
    locale: string;
    label: string;
    title?: string;
    ariaLabel?: string;
    urlOverride?: string;
  }>;
  children: MenuTreePayload[];
};

function toTreePayload(item: WebsiteMenuItem): MenuTreePayload {
  return {
    ...(item.id > 0 ? { id: item.id } : {}),
    type: item.type,
    ...(item.pageId ? { pageId: item.pageId } : {}),
    ...(item.url ? { url: item.url } : {}),
    target: item.target,
    ...(item.rel ? { rel: item.rel } : {}),
    ...(item.iconKey ? { iconKey: item.iconKey } : {}),
    isEnabled: item.isEnabled,
    translations: item.translations.map((translation) => ({
      locale: translation.locale,
      label: translation.label,
      ...(translation.title ? { title: translation.title } : {}),
      ...(translation.ariaLabel
        ? { ariaLabel: translation.ariaLabel }
        : {}),
      ...(translation.urlOverride
        ? { urlOverride: translation.urlOverride }
        : {}),
    })),
    children: item.children.map(toTreePayload),
  };
}

"use client";

import { readApiData } from "@/lib/api-response";

export type LocalSiteIconState = {
  configured: boolean;
  version: string | null;
  updatedAt: string | null;
  faviconUrl: string;
};

async function readState(response: Response) {
  return readApiData<LocalSiteIconState>(response);
}

export function getLocalSiteIconState() {
  return fetch("/api/admin/site-icon", {
    cache: "no-store",
    credentials: "include",
  }).then(readState);
}

export function uploadLocalSiteIcon(file: File) {
  const body = new FormData();
  body.append("favicon", file);
  return fetch("/api/admin/site-icon", {
    method: "POST",
    credentials: "include",
    body,
  }).then(readState);
}

export function deleteLocalSiteIcon() {
  return fetch("/api/admin/site-icon", {
    method: "DELETE",
    credentials: "include",
  }).then(readState);
}

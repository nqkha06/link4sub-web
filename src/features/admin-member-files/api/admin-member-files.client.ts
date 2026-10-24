"use client";

import { authenticatedApiRequest } from "@/lib/api-client";
import type { AdminMemberFile } from "../types";

type BulkResult = { affected: number; releasedBytes?: number };

function bulk(action: "trash" | "restore" | "purge", ids: number[]) {
  return authenticatedApiRequest<BulkResult>(`/admin/files/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

export const trashAdminMemberFiles = (ids: number[]) => bulk("trash", ids);
export const restoreAdminMemberFiles = (ids: number[]) => bulk("restore", ids);
export const purgeAdminMemberFiles = (ids: number[]) => bulk("purge", ids);

export function getAdminMemberFilePreviewUrl(file: Pick<AdminMemberFile, "previewUrl">) {
  return file.previewUrl;
}

/** Authorize via JSON, then let the native download manager fetch media bytes. */
export async function downloadAdminMemberFile(id: number, fileName: string) {
  const { url } = await authenticatedApiRequest<{ url: string | null }>(`/admin/files/${id}/download-url`);
  const anchor = document.createElement("a");
  anchor.href = url ?? `/api/backend/admin/files/${id}/download`;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

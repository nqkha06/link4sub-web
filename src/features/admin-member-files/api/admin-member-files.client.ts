"use client";

import { authenticatedApiFetch, authenticatedApiRequest } from "@/lib/api-client";
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

/** Downloads the stored file through the authenticated API and saves it locally. */
export async function downloadAdminMemberFile(id: number, fileName: string) {
  const response = await authenticatedApiFetch(`/admin/files/${id}/download`);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  const url = URL.createObjectURL(await response.blob());
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

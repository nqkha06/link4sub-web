import "server-only";

import { serializeAnnouncementsTableQuery } from "@/features/announcements/api/announcements-query-serializer";
import type { AnnouncementsTableQuery } from "@/features/announcements/query/announcements-search-params";
import type { AdminAnnouncement } from "@/features/announcements/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readPaginatedApiResponse } from "@/lib/api-response";

export type AdminAnnouncementsTableData = {
  data: AdminAnnouncement[];
  total: number;
  pageCount: number;
};

export async function getAdminAnnouncementsTableData(
  state: AnnouncementsTableQuery,
): Promise<AdminAnnouncementsTableData> {
  const response = await serverApiFetch(
    `/admin/announcements?${serializeAnnouncementsTableQuery(state)}`,
    { cache: "no-store" },
  );
  const result = await readPaginatedApiResponse<AdminAnnouncement>(response);
  return { data: result.data, total: result.meta.total, pageCount: result.meta.totalPages };
}

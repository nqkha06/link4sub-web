import "server-only";

import { readApiData } from "@/lib/api-response";
import { serverApiFetch } from "@/lib/auth/server-api";

import type { SystemCleanupOverview } from "../types";

export async function getSystemCleanupOverview(olderThanDays = 90) {
  const response = await serverApiFetch(
    `/admin/system-cleanup?olderThanDays=${olderThanDays}`,
    { cache: "no-store" },
  );
  return readApiData<SystemCleanupOverview>(response);
}

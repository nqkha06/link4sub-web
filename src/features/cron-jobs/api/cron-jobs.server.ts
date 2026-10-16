import "server-only";

import { readApiData } from "@/lib/api-response";
import { serverApiFetch } from "@/lib/auth/server-api";

import type { CronJobsOverview } from "../types";

export async function getCronJobsOverview() {
  const response = await serverApiFetch("/admin/cron-jobs", { cache: "no-store" });
  return readApiData<CronJobsOverview>(response);
}

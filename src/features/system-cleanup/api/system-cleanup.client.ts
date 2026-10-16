"use client";

import { authenticatedApiRequest } from "@/lib/api-client";

import type {
  SystemCleanupOverview,
  SystemCleanupResult,
  SystemCleanupTarget,
} from "../types";

export function getSystemCleanupOverviewClient(olderThanDays: number) {
  return authenticatedApiRequest<SystemCleanupOverview>(
    `/admin/system-cleanup?olderThanDays=${olderThanDays}`,
  );
}

export function runSystemCleanup(input: {
  targets: SystemCleanupTarget[];
  olderThanDays: number;
}) {
  return authenticatedApiRequest<SystemCleanupResult>(
    "/admin/system-cleanup",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

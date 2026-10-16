import "server-only";

import { serverApiFetch } from "@/lib/auth/server-api";
import { readPaginatedApiResponse } from "@/lib/api-response";

import type { IpReputationListResponse } from "../types";

export async function getAdminIpReputationList(input: {
  page?: number;
  status?: "active" | "expired";
}) {
  const query = new URLSearchParams();
  if (input.page) query.set("page", String(input.page));
  if (input.status) query.set("status", input.status);
  const response = await serverApiFetch(
    `/admin/ip-reputation?${query.toString()}`,
    { cache: "no-store" },
  );
  return readPaginatedApiResponse<IpReputationListResponse["data"][number]>(response);
}

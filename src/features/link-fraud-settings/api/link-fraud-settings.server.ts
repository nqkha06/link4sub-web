import "server-only";

import type { AdminLinkFraudSettings } from "../types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData } from "@/lib/api-response";

export async function getAdminLinkFraudSettings() {
  const response = await serverApiFetch(
    "/admin/settings/link-fraud",
    { cache: "no-store" },
  );
  return readApiData<AdminLinkFraudSettings>(response);
}

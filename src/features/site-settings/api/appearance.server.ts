import "server-only";

import type { AdminWebsiteSettings } from "@/features/site-settings/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData } from "@/lib/api-response";

export async function getAdminAppearanceSettings() {
  const response = await serverApiFetch(
    "/admin/settings/appearance",
    { cache: "no-store" },
  );
  return readApiData<AdminWebsiteSettings>(response);
}

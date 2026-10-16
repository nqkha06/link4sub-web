import "server-only"

import { serverApiFetch } from "@/lib/auth/server-api"
import { readApiData } from "@/lib/api-response"

import type {
  AdminDashboardData,
  AdminDashboardRange,
} from "../types"

export async function getAdminDashboard(range: AdminDashboardRange) {
  const response = await serverApiFetch(
    `/admin/dashboard?range=${range}`,
    { cache: "no-store" },
  )

  return readApiData<AdminDashboardData>(response)
}

import "server-only"

import { serverApiFetch } from "@/lib/auth/server-api"
import { readApiData } from "@/lib/api-response"

import type { MemberDashboardData, MemberDashboardRange } from "../types"

export async function getMemberDashboard(range: MemberDashboardRange) {
  const response = await serverApiFetch(
    `/member/dashboard?range=${range}`,
    { cache: "no-store" },
  )

  return readApiData<MemberDashboardData>(response)
}

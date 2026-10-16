import type {
  AdminSocialLinksTableData,
  AdminSocialLinksResponse,
} from "@/features/admin-social-links/types"

export function adaptAdminSocialLinksResponse(
  response: AdminSocialLinksResponse,
): AdminSocialLinksTableData {
  return {
    data: response.data,
    pageCount: response.meta.totalPages,
    total: response.meta.total,
    totalViews: response.meta.totalViews,
    totalRevenue: response.meta.totalRevenue,
  }
}

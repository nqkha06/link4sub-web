import type {
  AdminPagesTableData,
  AdminPagesResponse,
} from "@/features/admin-pages/types";

export function adaptAdminPagesResponse(
  response: AdminPagesResponse,
): AdminPagesTableData {
  return {
    data: response.data,
    pageCount: response.meta.totalPages,
    total: response.meta.total,
  };
}
